import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, ValidationPipe, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Article, ArticleStatus } from '@prisma/client';
import { Paginate } from 'src/app/interface/app.interface';
import { FilterArticleQueryDto } from './dto/filter-article.dto';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Article')
@Controller({
    path: 'article',
    version: '1',
})
export class ArticleController {
    constructor(private readonly articleService: ArticleService) { }

    @ApiBearerAuth()
    @Post()
    create(@Body() createArticleDto: CreateArticleDto) {
        // return this.articleService.create(createArticleDto);
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
    update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
        return this.articleService.update(id, updateArticleDto);
    }

    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.articleService.remove(id);
    }
}
