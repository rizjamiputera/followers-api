import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';
import { Content, ContentStatus, ContentTag, Event, Prisma, ReactionType, Tag } from '@prisma/client';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate, VisitPayload } from 'src/app/interface/app.interface';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { FilterEventQueryDto } from './dto/filter-event.dto';

const VALID_INCLUDES = [
    'content',
    'tags.tag',
    'comments',
    'comments.replies',
    'comments.reactions',
    'reactions',
    'versions',
    'author',
    'stats',
];
const transformImages = ['image', 'image_md', 'author.avatar', 'author.avatar_md'];


@Injectable()
export class EventService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    private transformData(data: Event & {
        tags?: (ContentTag & { tag: Tag })[]
        content?: Content
    }): Event {
        const tags = data.tags;
        delete data.tags;

        const event = {
            ...data,
            ...(tags && {
                tags: tags.map(t => t.tag)
            })
        }

        const apiUri = process.env.API_URI || 'http://localhost:5111';

        if (event.content) {
            event.content.content['content'] = event.content.content['content'].map((c: any) => ({
                ...c,
                ...(c.type == 'image' && {
                    attrs: {
                        ...c.attrs,
                        src: apiUri + c.attrs.src
                    }
                })
            }))
        }

        return this.app.transformImageUrls(event, ...transformImages)
    }

    private transformDataArray(data: Event[]): Event[] {
        return data.map(event => this.transformData(event));
    }

    async is_slug_available(slug: string) {
        const exist = await this.prisma.event.findUnique({
            where: {
                slug,
            },
            select: { id: true },
        });

        return !exist;
    }

    async create(
        data: Prisma.EventCreateInput & { tags?: string[] },
    ): Promise<Event> {
        const { tags, ...eventData } = data;

        // Handle tags if provided
        let tagConnections:
            | Prisma.ContentTagCreateNestedManyWithoutEventInput
            | undefined;

        if (tags && tags.length > 0) {
            const createdTags = await this.createTags(tags);

            tagConnections = {
                create: createdTags.map((tag) => ({
                    tag: { connect: { id: tag.id } },
                })),
            };
        }

        const create = await this.prisma.event.create({
            data: {
                ...eventData,
                ...(tagConnections && { tags: tagConnections }),
                stats: {
                    create: {}
                }
            },
        });

        if (create.image && create.image_md) {
            await this.assignMainPhoto(create.id, [create.image, create.image_md])
        }

        return create;
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterEventQueryDto,
    ): Promise<Paginate<Event[]>> {
        const { page, limit, sortBy, order, includes, deleted, search } =
            pagination;
        const { authorId, tags, status, exclude_statuses, published, start_from } = filter;
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const searchCondition: Prisma.EventWhereInput = search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { excerpt: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const whereConditions: Prisma.EventWhereInput[] = [
            searchCondition,
            { deleted },
        ];

        if (authorId) whereConditions.push({ authorId });
        if (status) whereConditions.push({ status });
        if (exclude_statuses) whereConditions.push({ status: { notIn: exclude_statuses as ContentStatus[] } });
        if (tags?.length > 0) {
            whereConditions.push({
                tags: { some: { tag: { slug: { in: tags } } } },
            });
        }
        if (published) {
            whereConditions.push({
                status: ContentStatus.PUBLISHED,
                ...(start_from
                    ? { start_at: { gte: start_from } }
                    : { start_at: { gte: new Date() } }
                )
                ,
            });
        }

        const where: Prisma.EventWhereInput = {
            AND: whereConditions.filter(
                (condition) => Object.keys(condition).length > 0,
            ),
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.event.count({ where }),
            this.prisma.event.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include,
            }),
        ]);
        return {
            data: this.transformDataArray(data),
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }

    async read(slug: string, includes: string[] = []): Promise<Event> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const event = await this.prisma.event.findUnique({
            where: {
                slug,
                status: ContentStatus.PUBLISHED,
                publishedAt: { lte: new Date() },
                deleted: false,
            },
            include,
        });

        if (!event) throw new NotFoundException('event is not found');

        return this.transformData(event)
    }

    async findOne(id: string, includes: string[] = []): Promise<Event> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const event = await this.prisma.event.findUnique({
            where: {
                id,
                deleted: false,
            },
            include,
        });

        return this.transformData(event)
    }

    async update(
        changedBy: string,
        id: string,
        data: Prisma.EventUpdateInput & {
            content?: any;
            tags?: string[];
        },
    ): Promise<Event> {
        const current = (await this.findOne(id, ['content'])) as Event & {
            content?: Content;
        };

        if (!current) throw new NotFoundException('Event is not found');

        if (current.authorId !== changedBy) {
            throw new ForbiddenException(
                'Only the author can update this event',
            );
        }

        // Separate content body and tags from event data
        const { content, tags, ...eventData } = data;

        // Check if content fields have changed
        const contentChanged =
            eventData.title !== current.title ||
            eventData.excerpt !== current.excerpt ||
            eventData.image !== current.image ||
            eventData.image_md !== current.image_md ||
            (content && current.content &&
                (JSON.stringify(content) !== JSON.stringify(current.content.content)));

        // Create version if content changed
        if (contentChanged && current.content) {
            await this.prisma.contentVersion.create({
                data: {
                    event: { connect: { id } },
                    title: current.title,
                    excerpt: current.excerpt,
                    image: current.image,
                    image_sm: current.image_md,
                    content: current.content.content,
                    createdAt: current.content.createdAt,
                },
            });
        }

        // update photo
        if (eventData.image && current.image_md) {
            // disconnet current photo
            await this.prisma.photoContent.updateMany({
                where: {
                    eventId: id,
                    main_photo: true,
                },
                data: { eventId: null }
            });

            await this.assignMainPhoto(id, [eventData.image as string, eventData.image_md as string])
        }


        // Update content if provided and changed
        if (content && current.contentId && contentChanged) {
            // remove host url
            const apiUri = process.env.API_URI || 'http://localhost:5111';
            content.content = content.content.map((c: any) => ({
                ...c,
                ...(c.type == 'image' && {
                    attrs: {
                        ...c.attrs,
                        src: c.attrs.src.replace(apiUri, '')
                    }
                })
            }));

            await this.prisma.content.update({
                where: { id: current.contentId },
                data: { content: content },
            });

            // disconnet current photo
            await this.prisma.photoContent.updateMany({
                where: {
                    eventId: id,
                    main_photo: false,
                },
                data: { eventId: null }
            })

            const photoPaths = content.content.filter((c: any) => c.type == 'image').map((c: any) => c.attrs.src);
            // assign photo to event
            await this.prisma.photoContent.updateMany({
                where: {
                    path: {
                        in: photoPaths
                    }
                },
                data: {
                    eventId: id
                }
            })
        }

        // Handle tags update if provided
        let tagUpdate:
            | Prisma.ContentTagUpdateManyWithoutEventNestedInput
            | undefined;

        if (tags !== undefined) {
            if (tags.length === 0) {
                // Delete all tags
                tagUpdate = { deleteMany: {} };
            } else {
                const createdTags = await this.createTags(tags);

                // Delete existing tags and create new ones
                tagUpdate = {
                    deleteMany: {},
                    create: createdTags.map((tag) => ({
                        tag: { connect: { id: tag.id } },
                    })),
                };
            }
        }

        const update = await this.prisma.event.update({
            where: { id },
            data: {
                ...eventData,
                ...(tagUpdate && { tags: tagUpdate }),
            },
        });

        return this.transformData(update);
    }

    async remove(id: string): Promise<void> {
        const current = await this.findOne(id);

        if (!current) throw new NotFoundException('Event is not found');

        await this.prisma.event.update({
            where: { id },
            data: { deleted: true },
        });

        return;
    }

    async updateStatus(
        id: string,
        dataDto: Prisma.EventUpdateInput,
        approvalDto?: Prisma.ContentApprovalCreateInput,
    ): Promise<void> {
        const current = await this.findOne(id);

        if (!current) throw new NotFoundException('Event is not found');

        await this.prisma.event.update({
            where: { id },
            data: dataDto
        });

        if (approvalDto) {
            await this.prisma.contentApproval.create({ data: approvalDto });
        }

        return;
    }

    async createTags(tags: string[]): Promise<Tag[]> {
        const processedTags = tags.map((tag) => {
            const lowerTag = tag.toLocaleLowerCase();
            return {
                name: lowerTag,
                slug: lowerTag.toLowerCase().replace(/\s+/g, '-'),
            };
        });

        // Upsert tags and get their data
        const tagPromises = processedTags.map((tag) =>
            this.prisma.tag.upsert({
                where: { slug: tag.slug },
                create: tag,
                update: {},
            }),
        );

        return Promise.all(tagPromises);
    }

    async react(
        userId: string,
        eventId: string,
        type: ReactionType,
    ): Promise<void> {
        const data: Prisma.ContentReactionCreateInput = {
            type,
            event: { connect: { id: eventId } },
            user: { connect: { id: userId } },
        };

        await this.prisma.$transaction(async (tx) => {
            let decrementLike = false;
            let decrementDisLike = false;
            const react = await tx.contentReaction.findUnique({
                where: {
                    eventId_userId: { eventId, userId },
                },
            });

            if (react) {
                // prevent double react
                if (type == react.type) return

                if (type == 'like') {
                    decrementDisLike = true;
                }
                if (type == 'dislike') {
                    decrementLike = true;
                }
            }

            await tx.contentReaction.upsert({
                where: {
                    eventId_userId: { eventId, userId },
                },
                update: { type },
                create: data,
            });

            await tx.contentStats.update({
                where: { eventId },
                data: {
                    ...(type == 'like' && {
                        likeCount: { increment: 1 },
                        ...(decrementDisLike && { dislikeCount: { decrement: 1 } }),
                    }),
                    ...(type == 'dislike' && {
                        dislikeCount: { increment: 1 },
                        ...(decrementLike && { likeCount: { decrement: 1 } }),
                    }),
                },
            });

            return;
        })

        return;
    }

    private async assignMainPhoto(eventId: string, photoPaths: string[]): Promise<void> {
        await this.prisma.photoContent.updateMany({
            where: {
                path: {
                    in: photoPaths
                }
            },
            data: {
                eventId,
                main_photo: true,
            }
        });

        return;
    }

    // STATISTICS
    async visit(slug: string, visit: VisitPayload): Promise<void> {
        return this.prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({
                where: { slug },
                include: { stats: true }
            });
            if (!event) throw new NotFoundException('Event not found');

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

            // check last visit within 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentVisit = await tx.visit.findFirst({
                where: {
                    eventId: event.id,
                    visitorId: visitor?.id ?? undefined,
                    visitedAt: { gte: fiveMinutesAgo },
                },
                orderBy: { visitedAt: 'desc' },
            });

            // Always log the visit (for analytics)
            await tx.visit.create({
                data: {
                    eventId: event.id,
                    visitorId: visitor?.id,
                    ipAddress: visit.ip,
                    userAgent: visit.userAgent,
                    referrer: visit.referrer,
                    path: visit.path
                },
            });

            // Only increment if not visited in last 5 minutes
            if (!recentVisit) {
                await tx.contentStats.update({
                    where: { id: event.stats.id },
                    data: {
                        readCount: { increment: 1 },
                        lastReadAt: new Date(),
                    },
                });
            }

            return;
        })
    }

    async share(eventId: string) {
        return this.prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({
                where: { id: eventId },
                include: { stats: true },
            });
            if (!event) throw new NotFoundException('Event not found');

            // increment stats
            await tx.contentStats.update({
                where: { id: event.stats.id },
                data: {
                    shareCount: { increment: 1 },
                },
            });

            return
        });
    }

}
