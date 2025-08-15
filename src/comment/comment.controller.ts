import { Controller, Get, Post, Body, Patch, Param, Delete, Request, HttpCode } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Public } from 'src/auth/auth.metadata';
import { FilterArticleQueryDto } from 'src/article/dto/filter-article.dto';
import { FilterCommentQueryDto } from './dto/filter-comment.dto';
import { ReactionQueryDto } from 'src/app/dto/reaction-query.dto';

@ApiTags('Comment')
@Controller({
    path: 'comment',
    version: '1',
})
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @ApiBearerAuth()
    @Post()
    create(
        @Request() req: any,
        @Body() dataDto: CreateCommentDto
    ) {
        const { articleId, parentId, mentionedId, content } = dataDto;
        const data: Prisma.CommentCreateInput = {
            content,
            user: { connect: { id: req.user.id } },
            article: { connect: { id: articleId } },
            ...(parentId && {
                parent: { connect: { id: parentId } }
            }),
            ...(mentionedId && {
                mentioned: { connect: { id: mentionedId } }
            }),
        }
        return this.commentService.create(data);
    }

    @Public()
    @Get()
    findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterCommentQueryDto,
    ) {
        return this.commentService.findAll(pagination, filter);
    }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.commentService.findOne(id);
    // }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dataDto: UpdateCommentDto
    ) {

        return this.commentService.update(id, req.user.id, dataDto.content);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        // TODO only admin / superadmin or author can delete
        return this.commentService.remove(id);
    }

    // FOR ERVERYONE
    @ApiBearerAuth()
    @Post('react/:id')
    @HttpCode(204)
    react(
        @Request() req: any,
        @Param('id') commentId: string,
        @Body() reaction: ReactionQueryDto,
    ) {
        const { type } = reaction;

        return this.commentService.react(req.user.id, commentId, type);
    }
}
