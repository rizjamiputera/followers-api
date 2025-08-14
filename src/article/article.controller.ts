import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, ValidationPipe, Query, Request, UseInterceptors, UploadedFile, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, ForbiddenException } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { ApprovalStatus, Article, ArticleStatus, Module, Permission, Prisma } from '@prisma/client';
import { Paginate } from 'src/app/interface/app.interface';
import { FilterArticleQueryDto } from './dto/filter-article.dto';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import { RejectArticleDto } from './dto/reject-article.dto';
import { ApproveArticleDto } from './dto/approve-article.dto';
import { PublishArticleDto } from './dto/publish-article.dto';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';

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
    @Post()
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    async create(
        @Request() req: any,
        @Body() createArticleDto: CreateArticleDto,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    // max 10 MB
                    new MaxFileSizeValidator({ maxSize: 10000 * 1000 }),
                    new FileTypeValidator({
                        fileType: 'image/jpeg|jpg|png',
                    }),
                ],
            }),
        )
        image: Express.Multer.File,
    ) {

        const { large, medium } = await this.appService.save_images(
            image,
            '/article',
        );

        const { contentBody, ...articleDto } = createArticleDto;
        const data: Prisma.ArticleCreateInput = {
            ...articleDto,
            image: large,
            image_sm: medium,
            content: { create: { content: contentBody } },
            author: { connect: { id: req.user.id } },
            readStat: { create: {} }
        }

        return this.articleService.create(data);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.READ)
    @ApiBearerAuth()
    // @PermissionsRequired(Module.DRIVERS, Permission.READ)
    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterArticleQueryDto,
    ): Promise<Paginate<Article[]>> {
        return this.articleService.findAll(pagination, filter);
    }

    @Public()
    @Get(':published')
    published(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterArticleQueryDto,
    ): Promise<Paginate<Article[]>> {
        return this.articleService.findAll(pagination, {
            ...filter,
            status: ArticleStatus.PUBLISHED,
            published: true
        });
    }

    @Public()
    @Get('read/:id')
    read(
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        return this.articleService.read(id, query.includes);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.READ)
    @ApiBearerAuth()
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        return this.articleService.findOne(id, query.includes);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.EDIT)
    @ApiBearerAuth()
    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateArticleDto: UpdateArticleDto
    ) {
        return this.articleService.update(req.user.id, id, updateArticleDto);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.DELETE)
    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.articleService.remove(id);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.PUBLISH)
    @ApiBearerAuth()
    @Post('publish/:id')
    @HttpCode(204)
    async publish(
        @Request() req: any,
        @Param('id') id: string,
        @Body() approveArticleDto: PublishArticleDto
    ) {
        const currentData = await this.articleService.findOne(id);

        if (currentData.status == ArticleStatus.PUBLISHED) {
            throw new ForbiddenException(`Artikel sudah di PUBLISH`)
        }

        if (currentData.status != ArticleStatus.APPROVED) {
            throw new ForbiddenException(`Artikel dengan status ${currentData.status.replaceAll('_', ' ')} tidak dapat di publish.`)
        }

        const publishedAt = new Date(approveArticleDto.publishedAt)

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ArticleStatus.PUBLISHED,
            publishedAt
        };

        return this.articleService.updateStatus(id, dataArticle);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('approve/:id')
    @HttpCode(204)
    approve(
        @Request() req: any,
        @Param('id') id: string,
        @Body() approveArticleDto: ApproveArticleDto
    ) {
        const publishedAt = approveArticleDto.publishedAt ? new Date(approveArticleDto.publishedAt) : undefined;

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: publishedAt ? ArticleStatus.PUBLISHED : ArticleStatus.APPROVED,
            publishedAt
        };

        const dataApproval: Prisma.ArticleApprovalCreateInput = {
            article: { connect: { id } },
            status: ApprovalStatus.APPROVED,
            approver: { connect: { id: req.user.id } }
        }

        return this.articleService.updateStatus(id, dataArticle, dataApproval);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.APPROVE)
    @ApiBearerAuth()
    @Post('reject/:id')
    @HttpCode(204)
    reject(
        @Request() req: any,
        @Param('id') id: string,
        @Body() rejectArticleDto: RejectArticleDto,
    ) {
        const { note } = rejectArticleDto;

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ArticleStatus.REJECTED
        };

        const dataApproval: Prisma.ArticleApprovalCreateInput = {
            article: { connect: { id } },
            status: ApprovalStatus.REJECTED,
            note,
            approver: { connect: { id: req.user.id } }
        }

        return this.articleService.updateStatus(id, dataArticle, dataApproval);
    }

    @PermissionsRequired(Module.ARTICLE, Permission.PUBLISH)
    @ApiBearerAuth()
    @Post('take-down/:id')
    @HttpCode(204)
    take_down(
        @Request() req: any,
        @Param('id') id: string,
        @Body() rejectArticleDto: RejectArticleDto,
    ) {
        const { note } = rejectArticleDto;

        const dataArticle: Prisma.ArticleUpdateInput = {
            status: ArticleStatus.TAKE_DOWN
        };

        const dataApproval: Prisma.ArticleApprovalCreateInput = {
            article: { connect: { id } },
            status: ApprovalStatus.TAKE_DOWN,
            note,
            approver: { connect: { id: req.user.id } }
        }

        return this.articleService.updateStatus(id, dataArticle, dataApproval);
    }
}
