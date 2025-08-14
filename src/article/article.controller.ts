import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, ValidationPipe, Query, Request, UseInterceptors, UploadedFile, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Article, ArticleStatus, Prisma } from '@prisma/client';
import { Paginate } from 'src/app/interface/app.interface';
import { FilterArticleQueryDto } from './dto/filter-article.dto';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import { RejectArticleDto } from './dto/reject-article.dto';

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

    @ApiBearerAuth()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.articleService.findOne(id);
    }

    @ApiBearerAuth()
    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateArticleDto: UpdateArticleDto
    ) {
        return this.articleService.update(req.user.id, id, updateArticleDto);
    }

    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.articleService.remove(id);
    }

    @ApiBearerAuth()
    @Post('publish/:id')
    @HttpCode(204)
    approve(@Request() req: any, @Param('id') id: string) {
        return this.articleService.approve(req.user.id, id);
    }

    @ApiBearerAuth()
    @Post('reject/:id')
    @HttpCode(204)
    reject(
        @Request() req: any,
        @Param('id') id: string,
        @Body() rejectArticleDto: RejectArticleDto,
    ) {
        const { note } = rejectArticleDto;
        return this.articleService.reject(req.user.id, id, note);
    }
}
