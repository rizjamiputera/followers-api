import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) {}

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    async create(dto: CreateCategoryDto) {
        const slug = this.generateSlug(dto.name);

        const existing = await this.prisma.category.findFirst({
            where: {
                OR: [
                    { name: { equals: dto.name, mode: 'insensitive' } },
                    { slug },
                ],
            },
        });
        if (existing) {
            throw new ConflictException('Category with this name already exists');
        }

        return this.prisma.category.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }

    async findAll() {
        return this.prisma.category.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: {
                        articles: {
                            where: {
                                deleted: false,
                                status: 'PUBLISHED',
                            },
                        },
                        events: {
                            where: {
                                deleted: false,
                                status: 'PUBLISHED',
                            },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true, events: true },
                },
            },
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async findBySlug(slug: string) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { articles: true, events: true },
                },
            },
        });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async update(id: string, dto: UpdateCategoryDto) {
        const category = await this.findOne(id);

        let slug = category.slug;
        if (dto.name && dto.name !== category.name) {
            slug = this.generateSlug(dto.name);
            const existing = await this.prisma.category.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        {
                            OR: [
                                {
                                    name: {
                                        equals: dto.name,
                                        mode: 'insensitive',
                                    },
                                },
                                { slug },
                            ],
                        },
                    ],
                },
            });
            if (existing) {
                throw new ConflictException(
                    'Category with this name already exists',
                );
            }
        }

        return this.prisma.category.update({
            where: { id },
            data: { ...dto, slug },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        // onDelete: SetNull on Article/Event — rows stay, categoryId cleared.
        return this.prisma.category.delete({ where: { id } });
    }
}
