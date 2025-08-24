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
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import {
    ApprovalStatus,
    Article,
    ContentStatus,
    Module,
    Permission,
    Prisma,
} from '@prisma/client';
import { Paginate, VisitPayload } from 'src/app/interface/app.interface';
import { FilterArticleQueryDto } from './dto/filter-article.dto';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppService } from 'src/app.service';
import { RejectArticleDto } from './dto/reject-article.dto';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { ReactionQueryDto } from 'src/app/dto/reaction-query.dto';
import { PublishArticleDto } from './dto/publish-article.dto';

@ApiTags('Article')
@Controller({
    path: 'article',
    version: '1',
})
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly appService: AppService,
    ) { }

    @PermissionsRequired(Module.ARTICLE, Permission.CREATE)
    @ApiBearerAuth()
    @Get('slug/check')
    async checkSlugAvailability(@Query('slug') slug: string): Promise<boolean> {
        return this.articleService.is_slug_available(slug);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.CREATE)
    @ApiBearerAuth()
    @Post()
    async create(
        @Request() req: any,
        @Body(new ValidationPipe()) createArticleDto: CreateArticleDto,
    ) {

        const apiUri = process.env.API_URI || 'http://localhost:5111';

        const { content, tags, image, image_md, ...articleDto } = createArticleDto;
        const data: Prisma.ArticleCreateInput & { tags?: string[] } = {
            ...articleDto,
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

        return this.articleService.create(data);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.READ)
    @ApiBearerAuth()
    // @PermissionsRequired(Module.DRIVERS, Permission.READ)
    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterArticleQueryDto,
    ): Promise<Paginate<Article[]>> {
        return this.articleService.findAll(pagination, {
            ...filter,
            exclude_statuses: ['DRAFT']
        });
    }

    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.CREATE)
    @Get('my-articles')
    findMyArticle(
        @Request() req: any,
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterArticleQueryDto,
    ): Promise<Paginate<Article[]>> {

        return this.articleService.findAll(pagination, {
            ...filter,
            authorId: req.user.id
        });
    }

    @Public()
    @Get('published')
    published(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterArticleQueryDto,
    ): Promise<Paginate<Article[]>> {
        return this.articleService.findAll(pagination, {
            ...filter,
            status: ContentStatus.PUBLISHED,
            published: true,
        });
    }

    @Public()
    @Get('read/:slug')
    read(
        @Param('slug') slug: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        return this.articleService.read(slug, query.includes);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.READ)
    @ApiBearerAuth()
    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        const article = await this.articleService.findOne(id, query.includes);

        if (!article) throw new NotFoundException('Article is not found');

        return article;
    }

    @PermissionsRequired(Module.ARTICLE, Permission.READ, Permission.CREATE)
    @ApiBearerAuth()
    @Get('my/:id')
    async readMyArticle(
        @Request() req: any,
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        const article = await this.articleService.findOne(id, query.includes);

        if (!article) throw new NotFoundException('Article is not found');

        if (article.authorId != req.user.id) {
            throw new ForbiddenException('Article hanya bisa di akses oleh penulisnya')
        }

        return article;
    }

    @PermissionsRequired(Module.ARTICLE, Permission.CREATE, Permission.EDIT)
    @ApiBearerAuth()
    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateArticleDto: UpdateArticleDto,
    ) {
        const apiUri = process.env.API_URI || 'http://localhost:5111';

        if (updateArticleDto.image && updateArticleDto.image_md) {
            updateArticleDto.image = updateArticleDto.image.replace(apiUri, '');
            updateArticleDto.image_md = updateArticleDto.image_md.replace(apiUri, '');
        }
        return this.articleService.update(req.user.id, id, updateArticleDto);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.DELETE)
    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.articleService.remove(id);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.CREATE, Permission.EDIT, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('draft/:id')
    @HttpCode(204)
    async draft(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        const currentData = await this.articleService.findOne(id);

        if (!currentData) throw new NotFoundException('Article is not found');

        if (currentData.status == ContentStatus.DRAFT) {
            return
        }

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ContentStatus.DRAFT,
            publishedAt: null,
        };

        await this.articleService.updateStatus(id, dataArticle);

        return
    }

    @PermissionsRequired(Module.ARTICLE, Permission.CREATE, Permission.EDIT)
    @ApiBearerAuth()
    @Post('review/:id')
    @HttpCode(204)
    async review(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        const currentData = await this.articleService.findOne(id);

        if (!currentData) throw new NotFoundException('Article is not found');

        if (currentData.status == ContentStatus.ON_REVIEW) {
            return
        }

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ContentStatus.ON_REVIEW,
            publishedAt: null,
        };

        await this.articleService.updateStatus(id, dataArticle);

        return
    }

    @PermissionsRequired(Module.ARTICLE, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('publish/:id')
    @HttpCode(204)
    async publish(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) publishDto: PublishArticleDto,
    ) {
        const currentData = await this.articleService.findOne(id);

        if (!currentData) throw new NotFoundException('Article is not found');

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ContentStatus.PUBLISHED,
            publishedAt: publishDto ? publishDto.publishedAt ?? null : null,
        };

        const dataApproval: Prisma.ContentApprovalCreateInput = {
            article: { connect: { id } },
            status: ApprovalStatus.PUBLISHED,
            approver: { connect: { id: req.user.id } },
        };

        await this.articleService.updateStatus(id, dataArticle, dataApproval);

        return
    }


    @PermissionsRequired(Module.ARTICLE, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('reject/:id')
    @HttpCode(204)
    async reject(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) rejectArticleDto: RejectArticleDto,
    ) {
        const currentData = await this.articleService.findOne(id);
        if (currentData.status == ContentStatus.REJECTED) {
            return
        }

        if (!currentData) throw new NotFoundException('Article is not found');

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ContentStatus.REJECTED,
            publishedAt: null
        };


        const dataApproval: Prisma.ContentApprovalCreateInput = {
            article: { connect: { id } },
            status: ApprovalStatus.REJECTED,
            note: rejectArticleDto ? rejectArticleDto.note ?? null : null,
            approver: { connect: { id: req.user.id } },
        };

        return this.articleService.updateStatus(id, dataArticle, dataApproval);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('take-down/:id')
    @HttpCode(204)
    async take_down(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) rejectArticleDto: RejectArticleDto,
    ) {
        const currentData = await this.articleService.findOne(id);
        if (currentData.status == ContentStatus.TAKE_DOWN) {
            return
        }

        // const { note } = rejectArticleDto;

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ContentStatus.TAKE_DOWN,
        };

        const dataApproval: Prisma.ContentApprovalCreateInput = {
            article: { connect: { id } },
            status: ApprovalStatus.TAKE_DOWN,
            note: rejectArticleDto ? rejectArticleDto.note ?? null : null,
            approver: { connect: { id: req.user.id } },
        };

        return this.articleService.updateStatus(id, dataArticle, dataApproval);
    }

    // FOR ERVERYONE
    @ApiBearerAuth()
    @Post('react/:id')
    @HttpCode(204)
    react(
        @Request() req: any,
        @Param('id') articleId: string,
        @Body(new ValidationPipe()) reaction: ReactionQueryDto,
    ) {
        const { type } = reaction;

        return this.articleService.react(req.user.id, articleId, type);
    }

    // STATISTICS
    @Public()
    @Post('visit/:slug')
    visit(
        @Req() req,
        @Param('slug') slug: string,
    ) {

        const visit: VisitPayload = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer'] || null,
            userId: req.user?.id || null, // if auth use
            fingerprint: req.headers['x-fingerprint'] || null,
        }

        return this.articleService.visit(slug, visit);
    }

    @Public()
    @Post('share/:id')
    share(
        @Param('id') id: string,
    ) {
        return this.articleService.share(id);
    }

    @ApiBearerAuth()
    @Post('bookmark/:id')
    bookmark(
        @Req() req,
        @Param('id') id: string,
    ) {
        return this.articleService.bookmark(id, req.user.id);
    }

    @ApiBearerAuth()
    @Post('unbookmark/:id')
    unbookmark(
        @Req() req,
        @Param('id') id: string,
    ) {
        return this.articleService.unbookmark(id, req.user.id);
    }
}
