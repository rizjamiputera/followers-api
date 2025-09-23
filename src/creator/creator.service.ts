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

        const searchCondition: Prisma.ProfileWhereInput = search
            ? {
                OR: [
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }
            : {};

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
