import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { AppService } from 'src/app.service';
import { Prisma } from '@prisma/client';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';

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
        pagination: PaginationIncludeQueryDto
    ) {
        const { search, page, limit, sortBy, order, includes } = pagination;

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

        const whereConditions: Prisma.ProfileWhereInput[] = [
            { isPublic: true },
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
            const baseWhere: Prisma.ProfileWhereInput = {
                isPublic: true,
            };

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

    // update(id: number, updateCreatorDto: UpdateCreatorDto) {
    //     return `This action updates a #${id} creator`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} creator`;
    // }
}
