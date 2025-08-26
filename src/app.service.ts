import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Paginate, SavedImage, VisitPayload } from './app/interface/app.interface';
import * as path from 'path';
import * as sharp from 'sharp';
import { PrismaService } from './prisma.service';
import { ErrorLog, Prisma } from '@prisma/client';
import { PaginationIncludeQueryDto, PaginationQueryDto } from './app/dto/pagination-query.dto';
import { nestedOrderBy } from './app/decorator/nestedOrderBy';

@Injectable()
export class AppService {

    constructor(
        private prisma: PrismaService,
    ) { }

    async createPath(path: string) {
        try {
            await fs.access(path);
        } catch (_e) {
            await fs.mkdir(path);
        }
    }

    async removeFile(file: any) {
        try {
            // prevent remove dummy file
            if (file.includes('dummy')) return;

            await fs.rm('./public/' + file);
        } catch (_e) { }
    }

    getFileExtention(file: Express.Multer.File): string {
        return file.originalname.split('.').pop();
    }

    getFileSuffix(): string {
        return Date.now() + '-' + Math.round(Math.random() * 1e9);
    }

    async resizeImage(
        size: number,
        file: Express.Multer.File,
        filepath: string,
        format = 'webp' // 👈 default to jpeg
    ) {
        // Ensure the directory exists before writing the file
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });

        // Get image metadata (width, height)
        const metadata = await sharp(file.buffer).metadata();

        // Skip resizing if the original image width is smaller than the target size
        if (metadata.width && metadata.width < size) {
            // Save original image as webp
            let image = sharp(file.buffer);

            // Apply format conversion
            if (format === 'jpeg') {
                image = image.jpeg({ quality: 85 }) // adjust quality
            } else if (format === 'webp') {
                image = image.webp({ quality: 85 })
            }

            const webpBuffer = await image.toBuffer();
            await fs.writeFile(filepath, webpBuffer);
            return;
        }

        let image = sharp(file.buffer, { animated: true })
            .resize(size);

        // Apply format conversion
        if (format === 'jpeg') {
            image = image.jpeg({ quality: 85 }) // adjust quality
        } else if (format === 'webp') {
            image = image.webp({ quality: 85 })
        }

        const resizedBuffer = await image.toBuffer();

        // Save the resized image to disk
        await fs.writeFile(filepath, resizedBuffer);
    }

    async save_image(
        file: Express.Multer.File,
        path_to_save: string = '',
        size: number = 1200,
        format = 'webp' // 👈 default to jpeg
    ): Promise<string> {
        const suffix = this.getFileSuffix();
        const filename = `${suffix}.${format}`;
        const filepath = path.join(`./public${path_to_save}/${filename}`);
        try {
            await this.resizeImage(size, file, filepath, format);
            return `${path_to_save}/${filename}`;
        } catch (_e) {
            this.removeFile(filepath);
            throw _e;
        }
    }
    async save_images(
        file: Express.Multer.File,
        path_to_save: string = '',
    ): Promise<SavedImage> {
        const suffix = this.getFileSuffix();
        try {
            const sizes = [
                { key: 'md', size: 600 },
                { key: 'lg', size: 1200 },
            ];

            await Promise.all(
                sizes.map(async (s) => {
                    const { key, size } = s;
                    const filename = `${suffix}_${key}.webp`;
                    const filepath = path.join(
                        `./public${path_to_save}/${filename}`,
                    );
                    await this.resizeImage(size, file, filepath);
                }),
            );

            return {
                large: `${path_to_save}/${suffix}_lg.webp`,
                medium: `${path_to_save}/${suffix}_md.webp`,
            };
        } catch (_e) {
            this.removeFile(`./public${path_to_save}/${suffix}_lg.webp`);
            this.removeFile(`./public${path_to_save}/${suffix}_md.webp`);
        }
    }

    getValidIncludes(
        validIncludes: string[],
        includes: string[],
        check_deleted = true,
    ): Record<string, any> {
        const result = {};

        // Models that have 'deleted' field
        const modelsWithDeleted = [
            'user',
            'users',
            'comments',
            'replies',
            'parent',
            'article',
            'articles',
        ];

        // Helper to check if a relation should have deleted filter
        const shouldApplyDeletedFilter = (relationName: string): boolean => {
            return (
                check_deleted &&
                modelsWithDeleted.some((model) =>
                    relationName.toLowerCase().includes(model),
                )
            );
        };

        // Filter valid includes that are requested
        const requestedIncludes = validIncludes.filter((relation) =>
            includes.includes(relation),
        );

        requestedIncludes.forEach((relation) => {
            const parts = relation.split('.');
            let current = result;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;

                if (!current[part]) {
                    if (isLast) {
                        // Last part - set the actual value
                        if (shouldApplyDeletedFilter(part)) {
                            current[part] = { where: { deleted: false } };
                        } else {
                            current[part] = true;
                        }
                    } else {
                        // Not last part - create nested structure
                        current[part] = { include: {} };
                    }
                } else if (!isLast) {
                    // If the part already exists but we need to go deeper
                    // Convert boolean/object to nested structure if needed
                    if (
                        current[part] === true ||
                        (current[part] && !current[part].include)
                    ) {
                        const includeObj: any = { include: {} };
                        if (shouldApplyDeletedFilter(part)) {
                            includeObj.where = { deleted: false };
                        }
                        current[part] = includeObj;
                    }
                }

                // Move to next level
                if (!isLast) {
                    current = current[part].include;
                }
            }
        });

        return result;
    }

    transformImageUrls(data: any, ...keys: string[]): any {
        if (!data || keys.length === 0) return data;

        const apiUri = process.env.API_URI || 'http://localhost:5111';

        // Handle array data
        if (Array.isArray(data)) {
            return data.map(item => this.transformImageUrls(item, ...keys));
        }

        // Handle primitive types
        if (typeof data !== 'object') return data;

        const result = { ...data };

        keys.forEach(key => {
            if (key.includes('.')) {
                // Handle nested keys like 'user.avatar' or 'replies.user.avatar'
                const keyPath = key.split('.');

                // Check if first part is an array (e.g., 'replies' in 'replies.user.avatar')
                if (Array.isArray(result[keyPath[0]])) {
                    const arrayKey = keyPath[0];
                    const nestedPath = keyPath.slice(1);

                    result[arrayKey] = result[arrayKey].map(item => {
                        const nestedValue = this.getNestedValue(item, nestedPath);
                        if (nestedValue && typeof nestedValue === 'string') {
                            this.setNestedValue(item, nestedPath, `${apiUri}${nestedValue}`);
                        }
                        return item;
                    });
                } else {
                    const value = this.getNestedValue(result, keyPath);
                    if (value) {
                        if (typeof value === 'string') {
                            this.setNestedValue(result, keyPath, `${apiUri}${value}`);
                        } else if (Array.isArray(value)) {
                            const transformedArray = value.map(item =>
                                typeof item === 'string' ? `${apiUri}${item}` : item
                            );
                            this.setNestedValue(result, keyPath, transformedArray);
                        }
                    }
                }
            } else {
                // Handle simple keys like 'image'
                if (result[key]) {
                    if (typeof result[key] === 'string') {
                        result[key] = `${apiUri}${result[key]}`;
                    } else if (Array.isArray(result[key])) {
                        result[key] = result[key].map(item => this.transformImageUrls(item, ...key));
                    }
                }
            }
        });

        return result;
    }

    transformImageUrlsArray(data: any[], ...keys: string[]): any[] {
        return data.map(dt => this.transformImageUrls(dt, ...keys));
    }

    private getNestedValue(obj: any, path: string[]): any {
        return path.reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    private setNestedValue(obj: any, path: string[], value: any): void {
        const lastKey = path[path.length - 1];
        const parentPath = path.slice(0, -1);

        const parent = parentPath.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);

        if (parent) {
            parent[lastKey] = value;
        }
    }

    // STATISTICS
    async visit(visit: VisitPayload): Promise<void> {
        return this.prisma.$transaction(async (tx) => {
            let visitor = null;
            if (visit.fingerprint) {
                visitor = await tx.visitor.upsert({
                    where: { fingerprint: visit.fingerprint },
                    update: {
                        lastVisitAt: new Date(),
                        userId: visit.userId || undefined,
                    },
                    create: {
                        fingerprint: visit.fingerprint,
                        userId: visit.userId || undefined,
                    },
                });
            }

            // Always log the visit (for analytics)
            await tx.visit.create({
                data: {
                    visitorId: visitor?.id,
                    ipAddress: visit.ip,
                    userAgent: visit.userAgent,
                    referrer: visit.referrer,
                    path: visit.path
                }
            });

            return;
        })
    }


    async getAllErrorLog(
        pagination: PaginationIncludeQueryDto,
    ): Promise<Paginate<ErrorLog[]>> {
        const { search, page, limit, sortBy, order, includes } =
            pagination;

        const searchCondition: Prisma.ErrorLogWhereInput = search
            ? {
                OR: [
                    { id: isNaN(Number(search)) ? undefined : Number(search) }, // exact match
                    { method: { contains: search, mode: 'insensitive' } },
                    { path: { contains: search, mode: 'insensitive' } },
                    { message: { contains: search, mode: 'insensitive' } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }
            : {};

        const whereConditions: Prisma.ErrorLogWhereInput[] = [
            searchCondition,
        ];

        const where: Prisma.ErrorLogWhereInput = {
            AND: whereConditions.filter(
                (condition) => Object.keys(condition).length > 0,
            ),
        };


        const include = this.getValidIncludes(['user'], includes);

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.errorLog.count({ where }),
            this.prisma.errorLog.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include
            }),
        ]);

        return {
            data,
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }
}
