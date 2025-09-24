import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { AppService } from 'src/app.service';
import { Prisma } from '@prisma/client';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { FilterCreatorDto } from './dto/filter-creator.dto';

const VALID_INCLUDES = ['user', 'biography', 'socialLinks'];
const transformImages = ['user.avatar', 'user.avatar_md'];

@Injectable()
export class CreatorService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    // create(createCreatorDto: CreateCreatorDto) {
    //     return 'This action adds a new creator';
    // }

    async findAll(
        pagination: PaginationIncludeQueryDto,
        filter: FilterCreatorDto,
    ) {
        const { search, page, limit, sortBy, order, includes } = pagination;
        const { isPublic } = filter;

        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        // Build search conditions
        const searchConditions: Prisma.ProfileWhereInput[] = [];

        if (search) {
            const searchTerm = search.trim();

            searchConditions.push(
                // Search in user name
                { user: { name: { contains: searchTerm, mode: 'insensitive' } } }
            );

            // For specializations, we need to use raw SQL for partial matching
            // But first try some common variations
            const variations = [
                searchTerm,
                searchTerm.toLowerCase(),
                searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase(),
                searchTerm.toUpperCase(),
            ];

            // Add exact specialization matches
            searchConditions.push({
                specializations: {
                    hasSome: variations
                }
            });
        }

        const searchCondition: Prisma.ProfileWhereInput = search ? {
            OR: searchConditions
        } : {};

        // const publicFilter = forPublicRoute ? true : isPublic;

        const whereConditions: Prisma.ProfileWhereInput[] = [
            isPublic !== undefined && { isPublic },
            searchCondition,
        ];

        const where: Prisma.ProfileWhereInput = {
            AND: whereConditions.filter(
                (condition) => Object.keys(condition).length > 0,
            ),
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        // If there's a search term, we need to handle partial specialization matching
        if (search) {
            const searchTerm = search.trim().toLowerCase();

            // Get all profiles that match basic criteria
            const baseWhere: Prisma.ProfileWhereInput = isPublic !== undefined
                ? { isPublic }
                : {};

            // First get profiles matching user name
            const nameMatches = await this.prisma.profile.findMany({
                where: {
                    ...baseWhere,
                    user: { name: { contains: search, mode: 'insensitive' } }
                },
                include,
                orderBy: nestedOrderBy(sortBy, order),
            });

            // Then get profiles with specialization matches
            const allProfiles = await this.prisma.profile.findMany({
                where: baseWhere,
                include,
                orderBy: nestedOrderBy(sortBy, order),
            });

            // Filter profiles that have partial specialization matches
            const specializationMatches = allProfiles.filter(profile =>
                profile.specializations.some(spec =>
                    spec.toLowerCase().includes(searchTerm)
                )
            );

            // Combine and deduplicate results
            const combinedResults = [...nameMatches];
            specializationMatches.forEach(profile => {
                if (!combinedResults.find(p => p.id === profile.id)) {
                    combinedResults.push(profile);
                }
            });

            // Apply pagination to combined results
            const total = combinedResults.length;
            const data = combinedResults.slice(skip, skip + (take || combinedResults.length));

            return {
                data: this.app.transformImageUrlsArray(data, ...transformImages),
                limit,
                total,
                page,
                last_page: limit > 0 ? Math.ceil(total / limit) : 1,
            };
        }

        // Regular query without search
        const [total, data] = await Promise.all([
            this.prisma.profile.count({
                where,
            }),
            this.prisma.profile.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include,
            }),
        ]);

        return {
            data: this.app.transformImageUrlsArray(data, ...transformImages),
            limit,
            total,
            page,
            last_page: limit > 0 ? Math.ceil(total / limit) : 1,
        };
    }

    async findOne(
        slug: string,
        includes: string[] = [],
    ) {
        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        const data = await this.prisma.profile.findFirst({
            where: { slug },
            include,
        });

        if (!data) throw new NotFoundException('Creator tidak ditemukan')

        return this.app.transformImageUrls(data, ...transformImages);

    }
    async findOneByUserId(
        userId: string,
        includes: string[] = [],
    ) {
        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        const data = await this.prisma.profile.findFirst({
            where: { userId },
            include,
        });

        if (!data) throw new NotFoundException('Creator tidak ditemukan')

        return this.app.transformImageUrls(data, ...transformImages);
    }

    async update(userId: string, updateCreatorDto: any) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: { biography: true, socialLinks: true },
        });

        if (!profile) throw new NotFoundException('Creator tidak ditemukan');

        const { biography, socialLinks, ...profileData } = updateCreatorDto;

        if (profileData.slug && profileData.slug !== profile.slug) {
            const existingProfile = await this.prisma.profile.findUnique({
                where: { slug: profileData.slug },
            });

            if (existingProfile) {
                throw new Error('Username sudah digunakan');
            }
        }

        const updateData: any = {
            ...profileData,
        };

        if (biography) {
            updateData.biography = {
                update: {
                    content: biography,
                },
            };
        }

        if (socialLinks !== undefined) {
            await this.prisma.socialLink.deleteMany({
                where: { profileId: profile.id },
            });

            if (socialLinks.length > 0) {
                updateData.socialLinks = {
                    create: socialLinks.map((link: any) => ({
                        platform: link.platform,
                        url: link.url,
                        handle: link.handle || null,
                    })),
                };
            }
        }

        const updated = await this.prisma.profile.update({
            where: { userId },
            data: updateData,
            include: {
                biography: true,
                socialLinks: true,
                user: true,
            },
        });

        return this.app.transformImageUrls(updated, ...transformImages);
    }

    async getStats() {
        const [totalPublic, total] = await Promise.all([
            this.prisma.profile.count({
                where: { isPublic: true },
            }),
            this.prisma.profile.count(),
        ]);

        return {
            totalPublic,
            total,
        };
    }

    async togglePublic(id: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id },
        });

        if (!profile) throw new NotFoundException('Creator tidak ditemukan');

        const updated = await this.prisma.profile.update({
            where: { id },
            data: {
                isPublic: !profile.isPublic,
            },
        });

        return {
            message: 'Status public berhasil diubah',
            isPublic: updated.isPublic,
        };
    }

    // remove(id: number) {
    //     return `This action removes a #${id} creator`;
    // }
}
