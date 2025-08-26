import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    ValidationPipe,
    Query,
    Request,
    ForbiddenException,
    NotFoundException,
    Req,
} from '@nestjs/common';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import {
    ApprovalStatus,
    ContentStatus,
    Event,
    Module,
    Permission,
    Prisma,
} from '@prisma/client';
import { Paginate, VisitPayload } from 'src/app/interface/app.interface';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppService } from 'src/app.service';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { ReactionQueryDto } from 'src/app/dto/reaction-query.dto';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { FilterEventQueryDto } from './dto/filter-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PublishEventDto } from './dto/publish-event.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { EventWithAuthReaction } from './event-interface';

@ApiTags('Event')
@Controller({
    path: 'event',
    version: '1',
})
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly appService: AppService,
    ) { }

    @PermissionsRequired(Module.EVENT, Permission.CREATE)
    @ApiBearerAuth()
    @Get('slug/check')
    async checkSlugAvailability(@Query('slug') slug: string): Promise<boolean> {
        return this.eventService.is_slug_available(slug);
    }

    @PermissionsRequired(Module.EVENT, Permission.CREATE)
    @ApiBearerAuth()
    @Post()
    async create(
        @Request() req: any,
        @Body(new ValidationPipe()) createEventDto: CreateEventDto,
    ) {
        const apiUri = process.env.API_URI || 'http://localhost:5111';

        const { content, tags, image, image_md, ...eventDto } = createEventDto;
        const data: Prisma.EventCreateInput & { tags?: string[] } = {
            ...eventDto,
            ...(image && {
                image: image.replace(apiUri, ''),
            }),
            ...(image_md && {
                image_md: image_md.replace(apiUri, ''),
            }),
            content: { create: { content: content } },
            author: { connect: { id: req.user.id } },
            stats: { create: {} },
            ...(tags && { tags }),
        };

        return this.eventService.create(data);
    }

    @PermissionsRequired(Module.EVENT, Permission.READ)
    @ApiBearerAuth()
    // @PermissionsRequired(Module.DRIVERS, Permission.READ)
    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterEventQueryDto,
    ): Promise<Paginate<Event[]>> {
        return this.eventService.findAll(pagination, {
            ...filter,
            exclude_statuses: ['DRAFT'],
        });
    }

    @ApiBearerAuth()
    @PermissionsRequired(Module.EVENT, Permission.CREATE)
    @Get('my-events')
    findMyEvent(
        @Request() req: any,
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterEventQueryDto,
    ): Promise<Paginate<Event[]>> {
        return this.eventService.findAll(pagination, {
            ...filter,
            authorId: req.user.id,
        });
    }

    @Public()
    @Get('published')
    published(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterEventQueryDto,
    ): Promise<Paginate<Event[]>> {
        return this.eventService.findAll(pagination, {
            ...filter,
            status: ContentStatus.PUBLISHED,
            published: true,
        });
    }

    @Public()
    @Get('read/:slug')
    read(
        @Request() req: any,
        @Param('slug') slug: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ): Promise<EventWithAuthReaction> {
        return this.eventService.read(
            slug,
            query.includes,
            req.user?.id ?? null,
        );
    }

    @PermissionsRequired(Module.EVENT, Permission.READ)
    @ApiBearerAuth()
    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        const event = await this.eventService.findOne(id, query.includes);

        if (!event) throw new NotFoundException('Event is not found');

        return event;
    }

    @PermissionsRequired(Module.EVENT, Permission.READ, Permission.CREATE)
    @ApiBearerAuth()
    @Get('my/:id')
    async readMyEvent(
        @Request() req: any,
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        const event = await this.eventService.findOne(id, query.includes);

        if (!event) throw new NotFoundException('Event is not found');

        if (event.authorId != req.user.id) {
            throw new ForbiddenException(
                'Event hanya bisa di akses oleh penulisnya',
            );
        }

        return event;
    }

    @PermissionsRequired(Module.EVENT, Permission.CREATE, Permission.EDIT)
    @ApiBearerAuth()
    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateEventDto: UpdateEventDto,
    ) {
        const apiUri = process.env.API_URI || 'http://localhost:5111';

        if (updateEventDto.image && updateEventDto.image_md) {
            updateEventDto.image = updateEventDto.image.replace(apiUri, '');
            updateEventDto.image_md = updateEventDto.image_md.replace(
                apiUri,
                '',
            );
        }
        return this.eventService.update(req.user.id, id, updateEventDto);
    }

    @PermissionsRequired(Module.EVENT, Permission.DELETE)
    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.eventService.remove(id);
    }

    @PermissionsRequired(
        Module.EVENT,
        Permission.CREATE,
        Permission.EDIT,
        Permission.APPROVE,
    )
    @ApiBearerAuth()
    @Post('draft/:id')
    @HttpCode(204)
    async draft(@Request() req: any, @Param('id') id: string) {
        const currentData = await this.eventService.findOne(id);

        if (!currentData) throw new NotFoundException('Event is not found');

        if (currentData.status == ContentStatus.DRAFT) {
            return;
        }

        const dataEvent: Prisma.EventUpdateInput = {
            status: ContentStatus.DRAFT,
            publishedAt: null,
        };

        await this.eventService.updateStatus(id, dataEvent);

        return;
    }

    @PermissionsRequired(Module.EVENT, Permission.CREATE, Permission.EDIT)
    @ApiBearerAuth()
    @Post('review/:id')
    @HttpCode(204)
    async review(@Request() req: any, @Param('id') id: string) {
        const currentData = await this.eventService.findOne(id);

        if (!currentData) throw new NotFoundException('Event is not found');

        if (currentData.status == ContentStatus.ON_REVIEW) {
            return;
        }

        const dataEvent: Prisma.EventUpdateInput = {
            status: ContentStatus.ON_REVIEW,
            publishedAt: null,
        };

        await this.eventService.updateStatus(id, dataEvent);

        return;
    }

    @PermissionsRequired(Module.EVENT, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('reject/:id')
    @HttpCode(204)
    async reject(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) rejectEventDto: RejectEventDto,
    ) {
        const currentData = await this.eventService.findOne(id);
        if (currentData.status == ContentStatus.REJECTED) {
            return;
        }

        if (!currentData) throw new NotFoundException('Event is not found');

        const dataEvent: Prisma.EventUpdateInput = {
            status: ContentStatus.REJECTED,
            publishedAt: null,
        };

        const dataApproval: Prisma.ContentApprovalCreateInput = {
            event: { connect: { id } },
            status: ApprovalStatus.REJECTED,
            note: rejectEventDto ? (rejectEventDto.note ?? null) : null,
            approver: { connect: { id: req.user.id } },
        };

        return this.eventService.updateStatus(id, dataEvent, dataApproval);
    }

    @PermissionsRequired(Module.EVENT, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('approve/:id')
    @HttpCode(204)
    async approve(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) rejectEventDto: RejectEventDto,
    ) {
        const currentData = await this.eventService.findOne(id);
        if (currentData.status == ContentStatus.APPROVED) {
            return;
        }

        if (!currentData) throw new NotFoundException('Event is not found');

        const dataEvent: Prisma.EventUpdateInput = {
            status: ContentStatus.APPROVED,
            publishedAt: null,
        };

        const dataApproval: Prisma.ContentApprovalCreateInput = {
            event: { connect: { id } },
            status: ApprovalStatus.APPROVED,
            note: rejectEventDto ? (rejectEventDto.note ?? null) : null,
            approver: { connect: { id: req.user.id } },
        };

        return this.eventService.updateStatus(id, dataEvent, dataApproval);
    }


    @PermissionsRequired(Module.EVENT, Permission.PUBLISH)
    @ApiBearerAuth()
    @Post('publish/:id')
    @HttpCode(204)
    async publish(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) publishDto: PublishEventDto,
    ) {
        const currentData = await this.eventService.findOne(id);

        if (!currentData) throw new NotFoundException('Event is not found');

        const dataEvent: Prisma.EventUpdateInput = {
            status: ContentStatus.PUBLISHED,
            publishedAt: publishDto ? (publishDto.publishedAt ?? null) : null,
        };

        const dataApproval: Prisma.ContentApprovalCreateInput = {
            event: { connect: { id } },
            status: ApprovalStatus.PUBLISHED,
            approver: { connect: { id: req.user.id } },
        };

        await this.eventService.updateStatus(id, dataEvent, dataApproval);

        return;
    }

    @PermissionsRequired(Module.EVENT, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('take-down/:id')
    @HttpCode(204)
    async take_down(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) rejectEventDto: RejectEventDto,
    ) {
        const currentData = await this.eventService.findOne(id);
        if (currentData.status == ContentStatus.TAKE_DOWN) {
            return;
        }

        // const { note } = rejectEventDto;

        const dataEvent: Prisma.EventUpdateInput = {
            status: ContentStatus.TAKE_DOWN,
        };

        const dataApproval: Prisma.ContentApprovalCreateInput = {
            event: { connect: { id } },
            status: ApprovalStatus.TAKE_DOWN,
            note: rejectEventDto ? (rejectEventDto.note ?? null) : null,
            approver: { connect: { id: req.user.id } },
        };

        return this.eventService.updateStatus(id, dataEvent, dataApproval);
    }

    // FOR ERVERYONE
    @ApiBearerAuth()
    @Post('react/:id')
    @HttpCode(204)
    react(
        @Request() req: any,
        @Param('id') eventId: string,
        @Body(new ValidationPipe()) reaction: ReactionQueryDto,
    ) {
        const { type } = reaction;

        return this.eventService.react(req.user.id, eventId, type);
    }

    // STATISTICS
    @Public()
    @Post('visit/:slug')
    visit(@Req() req, @Param('slug') slug: string, @Body('path') path: string) {
        const visit: VisitPayload = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer'] || null,
            userId: req.user?.id || null, // if auth use
            fingerprint: req.headers['x-fingerprint'] || null,
            path,
        };

        return this.eventService.visit(slug, visit);
    }

    @Public()
    @Post('share/:id')
    share(@Param('id') id: string) {
        return this.eventService.share(id);
    }
}
