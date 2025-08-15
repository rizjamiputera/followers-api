import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Public } from 'src/auth/auth.metadata';

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
        const { articleId, parentId, content } = dataDto;
        const data: Prisma.CommentCreateInput = {
            content,
            user: { connect: { id: req.user.id } },
            article: { connect: { id: articleId } },
            ...(parentId && {
                parent: { connect: { id: parentId } }
            })
        }
        return this.commentService.create(data);
    }

    @Public()
    @Get()
    findAll(
        pagination: PaginationDeletedIncludeQueryDto,
    ) {
        // return this.commentService.findAll(pagination);
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
        return this.commentService.remove(id);
    }
}
