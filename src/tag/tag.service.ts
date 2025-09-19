import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
    constructor(private prisma: PrismaService) { }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    async create(createTagDto: CreateTagDto) {
        const slug = this.generateSlug(createTagDto.name);

        const existingTag = await this.prisma.tag.findFirst({
            where: {
                OR: [
                    {
                        name: {
                            equals: createTagDto.name,
                            mode: 'insensitive',
                        },
                    },
                    { slug: slug },
                ],
            },
        });

        if (existingTag) {
            throw new ConflictException('Tag with this name already exists');
        }

        return this.prisma.tag.create({
            data: {
                name: createTagDto.name,
                slug: slug,
                // color: createTagDto.color || null,
            },
        });
    }

    async findAll() {
        return this.prisma.tag.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { contents: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { contents: true },
                },
            },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        return tag;
    }

    async findBySlug(slug: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { contents: true },
                },
            },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        return tag;
    }

    async update(id: string, updateTagDto: UpdateTagDto) {
        const tag = await this.findOne(id);

        let slug = tag.slug;
        if (updateTagDto.name && updateTagDto.name !== tag.name) {
            slug = this.generateSlug(updateTagDto.name);

            const existingTag = await this.prisma.tag.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        {
                            OR: [
                                {
                                    name: {
                                        equals: updateTagDto.name,
                                        mode: 'insensitive',
                                    },
                                },
                                { slug: slug },
                            ],
                        },
                    ],
                },
            });

            if (existingTag) {
                throw new ConflictException(
                    'Tag with this name already exists',
                );
            }
        }

        return this.prisma.tag.update({
            where: { id },
            data: {
                ...updateTagDto,
                slug: slug,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.tag.delete({
            where: { id },
        });
    }

    async search(query: string) {
        return this.prisma.tag.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { slug: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { contents: true },
                },
            },
        });
    }
}
