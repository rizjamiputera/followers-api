import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';
import {
    Content,
    ContentReaction,
    ContentStatus,
    ContentTag,
    Event,
    EventRegistrationConfig,
    EventRegistration,
    Prisma,
    ReactionType,
    RegistrationStatus,
    Tag,
} from '@prisma/client';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate, VisitPayload } from 'src/app/interface/app.interface';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { FilterEventQueryDto } from './dto/filter-event.dto';
import { EventWithAuthReaction, EventWithRegistrationCount } from './event-interface';
import { CreateRegistrationConfigDto, UpdateRegistrationConfigDto, FormFieldDto } from './dto/registration-config.dto';
import { RegisterForEventDto, UpdateRegistrationDto, ConfirmRegistrationDto, CancelRegistrationDto, RegistrationFilterDto } from './dto/event-registration.dto';
import * as puppeteer from 'puppeteer';

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
    'registrationConfig',
    'registrations',
    'registrations.user',
];
const transformImages = [
    'image',
    'image_md',
    'author.avatar',
    'author.avatar_md',
];

@Injectable()
export class EventService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    private transformData(
        data: Event & {
            tags?: (ContentTag & { tag: Tag })[];
            content?: Content;
        },
    ): Event {
        const tags = data.tags;
        delete data.tags;

        const event = {
            ...data,
            ...(tags && {
                tags: tags.map((t) => t.tag),
            }),
        };

        const apiUri = process.env.API_URI || 'http://localhost:5111';

        if (event.content) {
            event.content.content['content'] = event.content.content[
                'content'
            ].map((c: any) => ({
                ...c,
                ...(c.type == 'image' && {
                    attrs: {
                        ...c.attrs,
                        src: apiUri + c.attrs.src,
                    },
                }),
            }));
        }

        return this.app.transformImageUrls(event, ...transformImages);
    }

    private transformDataArray(data: Event[]): Event[] {
        return data.map((event) => this.transformData(event));
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
                    create: {},
                },
            },
        });

        if (create.image && create.image_md) {
            await this.assignMainPhoto(create.id, [
                create.image,
                create.image_md,
            ]);
        }

        return create;
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterEventQueryDto,
    ): Promise<Paginate<Event[] | EventWithRegistrationCount[]>> {
        const { page, limit, sortBy, order, includes, deleted, search } =
            pagination;
        const {
            authorId,
            tags,
            status,
            exclude_statuses,
            published,
            start_from,
        } = filter;

        // Check if registeredCount is requested in includes
        const includeRegisteredCount = includes?.includes('registeredCount') || false;

        // Remove registeredCount from includes before processing valid includes
        const filteredIncludes = includes?.filter(inc => inc !== 'registeredCount') || [];
        const include = this.app.getValidIncludes(VALID_INCLUDES, filteredIncludes);

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
        if (exclude_statuses)
            whereConditions.push({
                status: { notIn: exclude_statuses as ContentStatus[] },
            });
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
                    : { start_at: { gte: new Date() } }),
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

        // Add registration count only if requested
        let dataWithRegistrationCount: EventWithRegistrationCount[];
        if (includeRegisteredCount) {
            dataWithRegistrationCount = await Promise.all(
                data.map(async (event) => {
                    const registeredCount = await this.prisma.eventRegistration.count({
                        where: {
                            eventId: event.id,
                            status: {
                                in: ['PENDING', 'CONFIRMED'],
                            },
                        },
                    });

                    return {
                        ...this.transformData(event),
                        registeredCount,
                    };
                })
            );

            // return {
            //     data: dataWithRegistrationCount,
            //     limit,
            //     total,
            //     page,
            //     last_page:
            //         limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
            // };
        }

        return {
            data: !includeRegisteredCount
                ? this.transformDataArray(data)
                : dataWithRegistrationCount,
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }

    async read(
        slug: string,
        includes: string[] = [],
        userId?: string,
    ): Promise<EventWithAuthReaction> {
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
        let auth_reaction: ContentReaction | null = null;
        let userRegistration: EventRegistration | null = null;

        if (userId) {
            // Get user's reaction to the event
            auth_reaction = await this.prisma.contentReaction.findUnique({
                where: {
                    eventId_userId: {
                        eventId: event.id,
                        userId,
                    },
                },
            });

            // Get user's registration for this event (if any)
            userRegistration = await this.prisma.eventRegistration.findFirst({
                where: {
                    eventId: event.id,
                    userId,
                    status: {
                        in: ['PENDING', 'CONFIRMED'], // Don't include cancelled registrations
                    },
                },
            });
        }

        // Get registration statistics
        const registeredCount = await this.prisma.eventRegistration.count({
            where: {
                eventId: event.id,
                status: {
                    in: ['PENDING', 'CONFIRMED'],
                },
            },
        });

        // Calculate available spots if there's a participant limit
        let availableSpots: number | null = null;
        if ((event as any).registrationConfig?.participantLimit) {
            const confirmedCount = await this.prisma.eventRegistration.count({
                where: {
                    eventId: event.id,
                    status: 'CONFIRMED',
                },
            });
            availableSpots = Math.max(0, (event as any).registrationConfig.participantLimit - confirmedCount);
        }

        const transform = this.transformData(event);

        return { ...transform, auth_reaction, userRegistration, registeredCount, availableSpots };
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

        return this.transformData(event);
    }

    async findOneWithUserContext(
        id: string,
        userId?: string,
        includes: string[] = []
    ): Promise<EventWithAuthReaction> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const event = await this.prisma.event.findUnique({
            where: {
                id,
                deleted: false,
            },
            include,
        });

        if (!event) throw new NotFoundException('Event is not found');

        let auth_reaction: ContentReaction | null = null;
        let userRegistration: EventRegistration | null = null;

        if (userId) {
            // Get user's reaction to the event
            auth_reaction = await this.prisma.contentReaction.findUnique({
                where: {
                    eventId_userId: {
                        eventId: event.id,
                        userId,
                    },
                },
            });

            // Get user's registration for this event (if any)
            userRegistration = await this.prisma.eventRegistration.findFirst({
                where: {
                    eventId: event.id,
                    userId,
                    status: {
                        in: ['PENDING', 'CONFIRMED'], // Don't include cancelled registrations
                    },
                },
            });
        }

        // Get registration statistics
        const registeredCount = await this.prisma.eventRegistration.count({
            where: {
                eventId: event.id,
                status: {
                    in: ['PENDING', 'CONFIRMED'],
                },
            },
        });

        // Calculate available spots if there's a participant limit
        let availableSpots: number | null = null;
        if ((event as any).registrationConfig?.participantLimit) {
            const confirmedCount = await this.prisma.eventRegistration.count({
                where: {
                    eventId: event.id,
                    status: 'CONFIRMED',
                },
            });
            availableSpots = Math.max(0, (event as any).registrationConfig.participantLimit - confirmedCount);
        }

        const transform = this.transformData(event);

        return { ...transform, auth_reaction, userRegistration, registeredCount, availableSpots };
    }

    async update(
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

        // if (current.authorId !== changedBy) {
        //     throw new ForbiddenException(
        //         'Only the author can update this event',
        //     );
        // }

        // Separate content body and tags from event data
        const { content, tags, ...eventData } = data;

        // Check if content fields have changed
        const contentChanged =
            eventData.title !== current.title ||
            eventData.excerpt !== current.excerpt ||
            eventData.image !== current.image ||
            eventData.image_md !== current.image_md ||
            (content &&
                current.content &&
                JSON.stringify(content) !==
                JSON.stringify(current.content.content));

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
                data: { eventId: null },
            });

            await this.assignMainPhoto(id, [
                eventData.image as string,
                eventData.image_md as string,
            ]);
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
                        src: c.attrs.src.replace(apiUri, ''),
                    },
                }),
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
                data: { eventId: null },
            });

            const photoPaths = content.content
                .filter((c: any) => c.type == 'image')
                .map((c: any) => c.attrs.src);
            // assign photo to event
            await this.prisma.photoContent.updateMany({
                where: {
                    path: {
                        in: photoPaths,
                    },
                },
                data: {
                    eventId: id,
                },
            });
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
            data: dataDto,
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
            const { statsId } = await this.prisma.event.findUnique({
                where: { id: eventId },
            });

            let decrementLike = false;
            let decrementDisLike = false;
            const react = await tx.contentReaction.findUnique({
                where: {
                    eventId_userId: { eventId, userId },
                },
            });

            if (react) {
                // prevent double react
                if (type == react.type) return;

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
                where: { id: statsId },
                data: {
                    ...(type == 'like' && {
                        likeCount: { increment: 1 },
                        ...(decrementDisLike && {
                            dislikeCount: { decrement: 1 },
                        }),
                    }),
                    ...(type == 'dislike' && {
                        dislikeCount: { increment: 1 },
                        ...(decrementLike && { likeCount: { decrement: 1 } }),
                    }),
                },
            });

            return;
        });

        return;
    }

    private async assignMainPhoto(
        eventId: string,
        photoPaths: string[],
    ): Promise<void> {
        await this.prisma.photoContent.updateMany({
            where: {
                path: {
                    in: photoPaths,
                },
            },
            data: {
                eventId,
                main_photo: true,
            },
        });

        return;
    }

    // STATISTICS
    async visit(slug: string, visit: VisitPayload): Promise<void> {
        return this.prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({
                where: { slug },
                include: { stats: true },
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
                    path: visit.path,
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
        });
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

            return;
        });
    }

    // EVENT REGISTRATION METHODS

    async createRegistrationConfig(
        eventId: string,
        configDto: CreateRegistrationConfigDto,
    ): Promise<EventRegistrationConfig> {
        const event = await this.findOne(eventId);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if config already exists
        const existingConfig = await this.prisma.eventRegistrationConfig.findUnique({
            where: { eventId }
        });

        if (existingConfig) {
            throw new BadRequestException('Registration config already exists for this event');
        }

        const configData: Prisma.EventRegistrationConfigCreateInput = {
            event: { connect: { id: eventId } },
            isEnabled: configDto.isEnabled,
            label: configDto.label || 'Registrasi',
            participantLimit: configDto.participantLimit,
            registrationStart: configDto.registrationStart ? new Date(configDto.registrationStart) : null,
            registrationEnd: configDto.registrationEnd ? new Date(configDto.registrationEnd) : null,
            formFields: configDto.formFields as any,
            requireApproval: configDto.requireApproval || false,
            confirmationMessage: configDto.confirmationMessage,
        };

        return this.prisma.eventRegistrationConfig.create({
            data: configData,
        });
    }

    async updateRegistrationConfig(
        eventId: string,
        configDto: UpdateRegistrationConfigDto,
    ): Promise<EventRegistrationConfig> {
        const config = await this.prisma.eventRegistrationConfig.findUnique({
            where: { eventId }
        });

        if (!config) {
            throw new NotFoundException('Registration config not found for this event');
        }

        const updateData: Prisma.EventRegistrationConfigUpdateInput = {
            ...(configDto.isEnabled !== undefined && { isEnabled: configDto.isEnabled }),
            ...(configDto.label !== undefined && { label: configDto.label }),
            ...(configDto.participantLimit !== undefined && { participantLimit: configDto.participantLimit }),
            ...(configDto.registrationStart && { registrationStart: new Date(configDto.registrationStart) }),
            ...(configDto.registrationEnd && { registrationEnd: new Date(configDto.registrationEnd) }),
            ...(configDto.formFields && { formFields: configDto.formFields as any }),
            ...(configDto.requireApproval !== undefined && { requireApproval: configDto.requireApproval }),
            ...(configDto.confirmationMessage !== undefined && { confirmationMessage: configDto.confirmationMessage }),
        };

        return this.prisma.eventRegistrationConfig.update({
            where: { eventId },
            data: updateData,
        });
    }

    async getRegistrationConfig(eventId: string): Promise<EventRegistrationConfig | null> {
        return this.prisma.eventRegistrationConfig.findUnique({
            where: { eventId }
        });
    }

    async registerForEvent(
        eventId: string,
        userId: string,
        registrationDto: RegisterForEventDto,
    ): Promise<EventRegistration> {
        // Check if event exists and is published
        const event = await this.prisma.event.findUnique({
            where: {
                id: eventId,
                status: ContentStatus.PUBLISHED,
                deleted: false,
            },
            include: { registrationConfig: true }
        });

        if (!event) {
            throw new NotFoundException('Event not found or not published');
        }

        if (!event.registrationConfig || !event.registrationConfig.isEnabled) {
            throw new BadRequestException('Registration is not enabled for this event');
        }

        // Check registration timing
        const now = new Date();
        if (event.registrationConfig.registrationStart && now < event.registrationConfig.registrationStart) {
            throw new BadRequestException('Registration has not started yet');
        }

        if (event.registrationConfig.registrationEnd && now > event.registrationConfig.registrationEnd) {
            throw new BadRequestException('Registration has ended');
        }

        // Check if user already registered with active status
        const existingRegistration = await this.prisma.eventRegistration.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId,
                }
            }
        });

        if (existingRegistration) {
            // If previous registration was cancelled, allow re-registration
            if (existingRegistration.status === RegistrationStatus.CANCELLED) {
                // Delete the cancelled registration to allow a fresh one
                await this.prisma.eventRegistration.delete({
                    where: {
                        id: existingRegistration.id
                    }
                });
            } else {
                // If registration is still pending or confirmed, prevent duplicate
                const statusMessage = existingRegistration.status === RegistrationStatus.PENDING
                    ? 'You already have a pending registration for this event'
                    : 'You are already registered for this event';
                throw new BadRequestException(statusMessage);
            }
        }

        // Check participant limit
        if (event.registrationConfig.participantLimit) {
            const confirmedCount = await this.prisma.eventRegistration.count({
                where: {
                    eventId,
                    status: RegistrationStatus.CONFIRMED,
                }
            });

            if (confirmedCount >= event.registrationConfig.participantLimit) {
                throw new BadRequestException('Event registration is full');
            }
        }

        // Validate form data against config
        this.validateFormData(registrationDto.formData, event.registrationConfig.formFields as unknown as FormFieldDto[]);

        // Create registration
        const registrationData: Prisma.EventRegistrationCreateInput = {
            event: { connect: { id: eventId } },
            user: { connect: { id: userId } },
            formData: registrationDto.formData,
            status: event.registrationConfig.requireApproval ? RegistrationStatus.PENDING : RegistrationStatus.CONFIRMED,
            ...(event.registrationConfig.requireApproval ? {} : { confirmedAt: new Date() }),
        };

        return this.prisma.eventRegistration.create({
            data: registrationData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    }
                }
            }
        });
    }

    async updateRegistration(
        registrationId: string,
        userId: string,
        updateDto: UpdateRegistrationDto,
    ): Promise<EventRegistration> {
        const registration = await this.prisma.eventRegistration.findUnique({
            where: { id: registrationId },
            include: {
                event: { include: { registrationConfig: true } }
            }
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        if (registration.userId !== userId) {
            throw new ForbiddenException('You can only update your own registration');
        }

        if (registration.status === RegistrationStatus.CANCELLED) {
            throw new BadRequestException('Cannot update cancelled registration');
        }

        // Check if registration is still open
        const now = new Date();
        if (registration.event.registrationConfig?.registrationEnd && now > registration.event.registrationConfig.registrationEnd) {
            throw new BadRequestException('Registration update period has ended');
        }

        // Validate form data if provided
        if (updateDto.formData && registration.event.registrationConfig?.formFields) {
            this.validateFormData(updateDto.formData, registration.event.registrationConfig.formFields as unknown as FormFieldDto[]);
        }

        const updateData: Prisma.EventRegistrationUpdateInput = {
            ...(updateDto.formData && { formData: updateDto.formData }),
            updatedAt: new Date(),
        };

        return this.prisma.eventRegistration.update({
            where: { id: registrationId },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    }

    async getEventRegistrations(
        eventId: string,
        pagination: PaginationDeletedIncludeQueryDto,
        filter: RegistrationFilterDto,
    ): Promise<Paginate<EventRegistration[]>> {
        const { page, limit, sortBy, order } = pagination;
        const { status, search } = filter;

        const whereConditions: Prisma.EventRegistrationWhereInput[] = [
            { eventId }
        ];

        if (status) {
            whereConditions.push({
                status: status as RegistrationStatus
            });
        }

        if (search) {
            whereConditions.push({
                OR: [
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                ]
            });
        }

        const where: Prisma.EventRegistrationWhereInput = {
            AND: whereConditions
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.eventRegistration.count({ where }),
            this.prisma.eventRegistration.findMany({
                where,
                orderBy: nestedOrderBy(sortBy || 'createdAt', order),
                skip,
                take,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar_md: true,
                        }
                    }
                }
            })
        ]);

        const apiUri = process.env.API_URI || 'http://localhost:5111';
        const dataRegistration = data.map(d => {
            return {
                ...d,
                user: {
                    ...d.user,
                    avatar_md: apiUri + d.user.avatar_md
                }
            }
        })

        return {
            data: dataRegistration,
            limit,
            total,
            page,
            last_page: limit > 0 ? Math.ceil(total / limit) : 1,
        };
    }

    async getUserRegistrations(
        userId: string,
        pagination: PaginationDeletedIncludeQueryDto,
    ): Promise<Paginate<EventRegistration[]>> {
        const { page, limit, sortBy, order } = pagination;

        const where: Prisma.EventRegistrationWhereInput = {
            userId
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.eventRegistration.count({ where }),
            this.prisma.eventRegistration.findMany({
                where,
                orderBy: nestedOrderBy(sortBy || 'createdAt', order),
                skip,
                take,
                include: {
                    event: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            start_at: true,
                            location: true,
                            image: true,
                        }
                    }
                }
            })
        ]);

        return {
            data: data.map(reg => ({
                ...reg,
                event: reg.event ? this.app.transformImageUrls(reg.event, 'image') : null
            })),
            limit,
            total,
            page,
            last_page: limit > 0 ? Math.ceil(total / limit) : 1,
        };
    }

    async confirmRegistration(
        registrationId: string,
        _confirmDto: ConfirmRegistrationDto,
    ): Promise<EventRegistration> {
        const registration = await this.prisma.eventRegistration.findUnique({
            where: { id: registrationId },
            include: {
                event: { include: { registrationConfig: true } }
            }
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        if (registration.status === RegistrationStatus.CONFIRMED) {
            throw new BadRequestException('Registration is already confirmed');
        }

        if (registration.status === RegistrationStatus.CANCELLED) {
            throw new BadRequestException('Cannot confirm cancelled registration');
        }

        // Check participant limit again
        if (registration.event.registrationConfig?.participantLimit) {
            const confirmedCount = await this.prisma.eventRegistration.count({
                where: {
                    eventId: registration.eventId,
                    status: RegistrationStatus.CONFIRMED,
                }
            });

            if (confirmedCount >= registration.event.registrationConfig.participantLimit) {
                throw new BadRequestException('Event registration is full');
            }
        }

        return this.prisma.eventRegistration.update({
            where: { id: registrationId },
            data: {
                status: RegistrationStatus.CONFIRMED,
                confirmedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    }

    async cancelRegistration(
        registrationId: string,
        userId: string,
        cancelDto: CancelRegistrationDto,
    ): Promise<EventRegistration> {
        const registration = await this.prisma.eventRegistration.findUnique({
            where: { id: registrationId }
        });

        if (!registration) {
            throw new NotFoundException('Registration not found');
        }

        if (registration.userId !== userId) {
            throw new ForbiddenException('You can only cancel your own registration');
        }

        if (registration.status === RegistrationStatus.CANCELLED) {
            throw new BadRequestException('Registration is already cancelled');
        }

        return this.prisma.eventRegistration.update({
            where: { id: registrationId },
            data: {
                status: RegistrationStatus.CANCELLED,
                cancelledAt: new Date(),
                cancellationNote: cancelDto.cancellationNote,
            }
        });
    }

    private validateFormData(formData: Record<string, any>, formFields: FormFieldDto[]): void {
        const requiredFields = formFields.filter(field => field.required);

        // Check required fields
        for (const field of requiredFields) {
            if (!formData[field.key] || formData[field.key] === '') {
                throw new BadRequestException(`Field '${field.label}' is required`);
            }
        }

        // Validate field types and constraints
        for (const field of formFields) {
            const value = formData[field.key];
            if (value === undefined || value === null || value === '') {
                continue; // Skip empty non-required fields
            }

            switch (field.type) {
                case 'EMAIL':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        throw new BadRequestException(`Field '${field.label}' must be a valid email address`);
                    }
                    break;

                case 'PHONE':
                    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,15}$/;
                    if (!phoneRegex.test(value)) {
                        throw new BadRequestException(`Field '${field.label}' must be a valid phone number`);
                    }
                    break;

                case 'NUMBER':
                    if (isNaN(Number(value))) {
                        throw new BadRequestException(`Field '${field.label}' must be a number`);
                    }
                    break;

                case 'DATE':
                    if (isNaN(Date.parse(value))) {
                        throw new BadRequestException(`Field '${field.label}' must be a valid date`);
                    }
                    break;

                case 'SELECT':
                case 'RADIO':
                    if (field.options && !field.options.includes(value)) {
                        throw new BadRequestException(`Field '${field.label}' must be one of: ${field.options.join(', ')}`);
                    }
                    break;

                case 'CHECKBOX':
                    if (field.options && Array.isArray(value)) {
                        const invalidOptions = value.filter(v => !field.options.includes(v));
                        if (invalidOptions.length > 0) {
                            throw new BadRequestException(`Field '${field.label}' contains invalid options: ${invalidOptions.join(', ')}`);
                        }
                    }
                    break;
            }

            // Custom validation rules
            if (field.validation) {
                if (field.validation.minLength && value.length < field.validation.minLength) {
                    throw new BadRequestException(`Field '${field.label}' must be at least ${field.validation.minLength} characters long`);
                }
                if (field.validation.maxLength && value.length > field.validation.maxLength) {
                    throw new BadRequestException(`Field '${field.label}' must be at most ${field.validation.maxLength} characters long`);
                }
                if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
                    throw new BadRequestException(`Field '${field.label}' format is invalid`);
                }
            }
        }
    }

    async exportEventRegistrationsToPDF(
        eventId: string,
        filter: RegistrationFilterDto,
    ): Promise<Buffer> {
        // Get the event details
        const event = await this.findOne(eventId, ['registrationConfig']);
        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Get all registrations for this event
        const registrations = await this.prisma.eventRegistration.findMany({
            where: {
                eventId,
                ...(filter.status && { status: filter.status as RegistrationStatus }),
                ...(filter.search && {
                    OR: [
                        { user: { name: { contains: filter.search, mode: 'insensitive' } } },
                        { user: { email: { contains: filter.search, mode: 'insensitive' } } },
                    ]
                }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get form fields from registration config
        const formFields = (event as any).registrationConfig?.formFields as FormFieldDto[] || [];

        // Calculate statistics
        const stats = {
            total: registrations.length,
            confirmed: registrations.filter(r => r.status === 'CONFIRMED').length,
            pending: registrations.filter(r => r.status === 'PENDING').length,
            cancelled: registrations.filter(r => r.status === 'CANCELLED').length,
        };

        // Generate HTML template for PDF
        const html = this.generateRegistrationPDFTemplate(event, registrations, formFields, stats);

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'domcontentloaded' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px',
                },
            });

            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }

    private generateRegistrationPDFTemplate(
        event: any,
        registrations: any[],
        formFields: FormFieldDto[],
        stats: { total: number; confirmed: number; pending: number; cancelled: number }
    ): string {
        const getStatusColor = (status: string) => {
            switch (status) {
                case 'CONFIRMED': return '#10b981'; // green-500
                case 'PENDING': return '#f59e0b';   // amber-500
                case 'CANCELLED': return '#ef4444'; // red-500
                default: return '#6b7280';          // gray-500
            }
        };

        const formatDate = (date: Date | null) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const formatFormValue = (value: any) => {
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return value || '-';
        };

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Event Registrations - ${event.title}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.4; color: #374151; }
                    .header { background: #f8fafc; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
                    .header h1 { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
                    .header p { color: #6b7280; margin-bottom: 3px; }
                    .stats { display: flex; gap: 15px; margin: 15px 0; }
                    .stat { background: white; padding: 10px 15px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center; min-width: 80px; }
                    .stat-value { font-size: 20px; font-weight: bold; margin-bottom: 3px; }
                    .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stat.confirmed .stat-value { color: #10b981; }
                    .stat.pending .stat-value { color: #f59e0b; }
                    .stat.cancelled .stat-value { color: #ef4444; }
                    .stat.total .stat-value { color: #3b82f6; }

                    .registration { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
                    .reg-header { background: #f9fafb; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                    .reg-header h3 { font-size: 16px; font-weight: 600; color: #1f2937; }
                    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; text-transform: uppercase; }
                    .reg-body { padding: 16px; }
                    .user-info { margin-bottom: 12px; }
                    .user-info h4 { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
                    .user-info p { color: #6b7280; font-size: 12px; }
                    .dates { display: flex; gap: 20px; margin-bottom: 12px; font-size: 11px; }
                    .date-item { color: #6b7280; }
                    .date-label { font-weight: 500; }
                    .form-data { border-top: 1px solid #f3f4f6; padding-top: 12px; }
                    .form-data h5 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; }
                    .form-fields { display: flex; flex-direction: column; gap: 2px; }
                    .form-field { }
                    .form-field-label { font-size: 10px; font-weight: 500; color: #6b7280; margin-bottom: 2px; }
                    .form-field-value { font-size: 11px; white-space: pre; color: #374151; }
                    .cancellation-note { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 8px; margin-top: 8px; }
                    .cancellation-note strong { color: #dc2626; font-size: 11px; }
                    .cancellation-note span { color: #7f1d1d; font-size: 10px; }

                    .no-registrations { text-align: center; padding: 40px; color: #6b7280; }
                    .page-break { page-break-before: always; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${event.title}</h1>
                    <p><strong>Event ID:</strong> ${event.slug}</p>
                    <p><strong>Export Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Export Time:</strong> ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div class="stats">
                    <div class="stat total">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat confirmed">
                        <div class="stat-value">${stats.confirmed}</div>
                        <div class="stat-label">Confirmed</div>
                    </div>
                    <div class="stat pending">
                        <div class="stat-value">${stats.pending}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat cancelled">
                        <div class="stat-value">${stats.cancelled}</div>
                        <div class="stat-label">Cancelled</div>
                    </div>
                </div>

                ${registrations.length === 0 ?
                '<div class="no-registrations"><p>No registrations found matching the current filters.</p></div>' :
                registrations.map((reg, index) => `
                        ${index > 0 && index % 8 === 0 ? '<div class="page-break"></div>' : ''}
                        <div class="registration">
                            <div class="reg-header">
                                <h3>#${index + 1} - ${reg.user.name}</h3>
                                <span class="status-badge" style="background-color: ${getStatusColor(reg.status)}">
                                    ${reg.status}
                                </span>
                            </div>
                            <div class="reg-body">
                                <div class="user-info">
                                    <h4>${reg.user.name}</h4>
                                    <p>${reg.user.email}</p>
                                </div>

                                <div class="dates">
                                    <div class="date-item">
                                        <span class="date-label">Registered:</span> ${formatDate(reg.createdAt)}
                                    </div>
                                    ${reg.confirmedAt ? `
                                        <div class="date-item">
                                            <span class="date-label">Confirmed:</span> ${formatDate(reg.confirmedAt)}
                                        </div>
                                    ` : ''}
                                    ${reg.cancelledAt ? `
                                        <div class="date-item">
                                            <span class="date-label">Cancelled:</span> ${formatDate(reg.cancelledAt)}
                                        </div>
                                    ` : ''}
                                </div>

                                ${formFields.length > 0 && reg.formData && Object.keys(reg.formData).length > 0 ? `
                                    <div class="form-data">
                                        <h5>Registration Information</h5>
                                        <div class="form-fields">
                                            ${formFields.map(field => `
                                                <div class="form-field">
                                                    <div class="form-field-label">${field.label}</div>
                                                    <div class="form-field-value">${formatFormValue(reg.formData[field.key])}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}

                                ${reg.cancellationNote ? `
                                    <div class="cancellation-note">
                                        <strong>Cancellation Reason:</strong>
                                        <span>${reg.cancellationNote}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')
            }
            </body>
            </html>
        `;
    }
}
