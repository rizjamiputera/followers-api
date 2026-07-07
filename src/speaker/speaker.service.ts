import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';
import { PaginationQueryDto } from '../app/dto/pagination-query.dto';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { FilterSpeakerDto } from './dto/filter-speaker.dto';
import { ContentSpeakerInputDto } from './dto/content-speaker-input.dto';

export interface ResolvedContentSpeaker {
    speakerId: string;
    role: string | null;
    sortOrder: number;
}

const transformImages = ['avatar', 'avatar_md'];

// Count only appearances tied to published, non-deleted content.
const publishedContentFilter: Prisma.ContentSpeakerWhereInput = {
    OR: [
        { article: { is: { status: 'PUBLISHED', deleted: false } } },
        { event: { is: { status: 'PUBLISHED', deleted: false } } },
    ],
};

@Injectable()
export class SpeakerService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) {}

    private baseSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // Names collide often (many "Ustadz Ahmad ..."), so append a numeric
    // suffix when the base slug is already taken.
    private async uniqueSlug(name: string, ignoreId?: string): Promise<string> {
        const base = this.baseSlug(name) || 'pemateri';
        let slug = base;
        let n = 1;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const existing = await this.prisma.speaker.findFirst({
                where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
                select: { id: true },
            });
            if (!existing) return slug;
            n += 1;
            slug = `${base}-${n}`;
        }
    }

    private async assertUserLinkable(userId: string, ignoreId?: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User tidak ditemukan');

        const linked = await this.prisma.speaker.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (linked && linked.id !== ignoreId) {
            throw new ConflictException(
                'User sudah tertaut ke pemateri lain',
            );
        }
    }

    async create(dto: CreateSpeakerDto) {
        if (dto.userId) await this.assertUserLinkable(dto.userId);

        const slug = await this.uniqueSlug(dto.name);

        const speaker = await this.prisma.speaker.create({
            data: {
                slug,
                name: dto.name,
                honorific: dto.honorific,
                credentials: dto.credentials,
                suffix: dto.suffix,
                bio: dto.bio,
                userId: dto.userId,
            },
        });

        return this.app.transformImageUrls(speaker, ...transformImages);
    }

    /**
     * Resolve a list of pemateri inputs (from the article/event editor) into
     * concrete speaker ids, creating new speakers on the fly when only a name
     * is provided. Deduplicates by speakerId (the ContentSpeaker join is unique
     * per content+speaker) and preserves input order via sortOrder.
     */
    async resolveContentSpeakers(
        inputs: ContentSpeakerInputDto[],
    ): Promise<ResolvedContentSpeaker[]> {
        const resolved: ResolvedContentSpeaker[] = [];
        const seen = new Set<string>();

        for (const input of inputs) {
            let speakerId = input.speakerId;

            if (speakerId) {
                const existing = await this.prisma.speaker.findFirst({
                    where: { id: speakerId, deleted: false },
                    select: { id: true },
                });
                if (!existing) {
                    throw new NotFoundException(
                        `Pemateri ${speakerId} tidak ditemukan`,
                    );
                }
            } else if (input.name?.trim()) {
                const slug = await this.uniqueSlug(input.name);
                const created = await this.prisma.speaker.create({
                    data: {
                        slug,
                        name: input.name.trim(),
                        honorific: input.honorific,
                        credentials: input.credentials,
                        suffix: input.suffix,
                    },
                    select: { id: true },
                });
                speakerId = created.id;
            } else {
                throw new BadRequestException(
                    'Setiap pemateri butuh speakerId atau name',
                );
            }

            if (seen.has(speakerId)) continue;
            seen.add(speakerId);

            resolved.push({
                speakerId,
                role: input.role ?? null,
                sortOrder: resolved.length,
            });
        }

        return resolved;
    }

    async findAll(pagination: PaginationQueryDto, filter: FilterSpeakerDto) {
        const { search, page = 1, limit = 10 } = pagination;
        const { verified } = filter;

        const where: Prisma.SpeakerWhereInput = {
            deleted: false,
            ...(verified !== undefined ? { verified } : {}),
            ...(search
                ? {
                      OR: [
                          { name: { contains: search, mode: 'insensitive' } },
                          {
                              honorific: {
                                  contains: search,
                                  mode: 'insensitive',
                              },
                          },
                      ],
                  }
                : {}),
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.speaker.count({ where }),
            this.prisma.speaker.findMany({
                where,
                orderBy: [{ verified: 'desc' }, { name: 'asc' }],
                skip,
                take,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            avatar: true,
                            avatar_md: true,
                        },
                    },
                    _count: {
                        select: {
                            contents: { where: publishedContentFilter },
                        },
                    },
                },
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

    async findOne(id: string) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, deleted: false },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                        avatar_md: true,
                    },
                },
                _count: {
                    select: { contents: { where: publishedContentFilter } },
                },
            },
        });
        if (!speaker) throw new NotFoundException('Pemateri tidak ditemukan');
        return this.app.transformImageUrls(speaker, ...transformImages);
    }

    async findBySlug(slug: string) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { slug, deleted: false },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                        avatar_md: true,
                    },
                },
                contents: {
                    where: publishedContentFilter,
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        role: true,
                        article: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                excerpt: true,
                                image: true,
                                image_md: true,
                                publishedAt: true,
                            },
                        },
                        event: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                excerpt: true,
                                image: true,
                                image_md: true,
                                start_at: true,
                            },
                        },
                    },
                },
            },
        });
        if (!speaker) throw new NotFoundException('Pemateri tidak ditemukan');
        return this.app.transformImageUrls(
            speaker,
            ...transformImages,
            'contents.article.image',
            'contents.article.image_md',
            'contents.event.image',
            'contents.event.image_md',
        );
    }

    async update(id: string, dto: UpdateSpeakerDto) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, deleted: false },
        });
        if (!speaker) throw new NotFoundException('Pemateri tidak ditemukan');

        const data: Prisma.SpeakerUpdateInput = {
            honorific: dto.honorific,
            credentials: dto.credentials,
            suffix: dto.suffix,
            bio: dto.bio,
        };

        if (dto.name && dto.name !== speaker.name) {
            data.name = dto.name;
            data.slug = await this.uniqueSlug(dto.name, id);
        }

        if (dto.userId !== undefined) {
            if (dto.userId === null || dto.userId === '') {
                data.user = { disconnect: true };
            } else {
                await this.assertUserLinkable(dto.userId, id);
                data.user = { connect: { id: dto.userId } };
            }
        }

        const updated = await this.prisma.speaker.update({
            where: { id },
            data,
        });
        return this.app.transformImageUrls(updated, ...transformImages);
    }

    async setVerified(id: string, verified: boolean) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, deleted: false },
            select: { id: true },
        });
        if (!speaker) throw new NotFoundException('Pemateri tidak ditemukan');

        return this.prisma.speaker.update({
            where: { id },
            data: { verified },
            select: { id: true, verified: true },
        });
    }

    async updateAvatar(id: string, avatar: string, avatarMd: string) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, deleted: false },
            select: { id: true, avatar: true, avatar_md: true },
        });
        if (!speaker) throw new NotFoundException('Pemateri tidak ditemukan');

        // Clean up previous files (best-effort).
        if (speaker.avatar) await this.app.removeFile(speaker.avatar);
        if (speaker.avatar_md) await this.app.removeFile(speaker.avatar_md);

        const updated = await this.prisma.speaker.update({
            where: { id },
            data: { avatar, avatar_md: avatarMd },
        });
        return this.app.transformImageUrls(updated, ...transformImages);
    }

    async remove(id: string) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, deleted: false },
            include: {
                _count: { select: { contents: true } },
            },
        });
        if (!speaker) throw new NotFoundException('Pemateri tidak ditemukan');

        // Soft-delete so existing article/event links are preserved. Block if
        // still attached to content to avoid silently orphaning references.
        if (speaker._count.contents > 0) {
            throw new BadRequestException(
                'Pemateri masih tertaut ke konten. Lepas tautannya terlebih dahulu.',
            );
        }

        await this.prisma.speaker.update({
            where: { id },
            data: { deleted: true },
        });
        return { message: 'Pemateri berhasil dihapus' };
    }
}
