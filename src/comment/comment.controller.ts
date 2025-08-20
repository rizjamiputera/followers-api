import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Request,
    HttpCode,
    Query,
    ValidationPipe,
    ForbiddenException,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Module, Permission, Prisma, Role } from '@prisma/client';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Public } from 'src/auth/auth.metadata';
import { FilterCommentQueryDto } from './dto/filter-comment.dto';
import { ReactionQueryDto } from 'src/app/dto/reaction-query.dto';
import { UserService } from 'src/user/user.service';

@ApiTags('Comment')
@Controller({
    path: 'comment',
    version: '1',
})
export class CommentController {
    constructor(
        private readonly commentService: CommentService,
        private readonly userService: UserService,
    ) { }

    @ApiBearerAuth()
    @Post()
    create(
        @Request() req: any,
        @Body(new ValidationPipe()) dataDto: CreateCommentDto,
    ) {
        const { articleId, parentId, mentionedId, content } = dataDto;
        const data: Prisma.CommentCreateInput = {
            content,
            user: { connect: { id: req.user.id } },
            article: { connect: { id: articleId } },
            ...(parentId && {
                parent: { connect: { id: parentId } },
            }),
            ...(mentionedId && {
                mentioned: { connect: { id: mentionedId } },
            }),
        };
        return this.commentService.create(data);
    }

    @Public()
    @Get()
    findAll(
        @Request() req: any,
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterCommentQueryDto,
    ) {

        // const authUserId = req.user?.id;

        return this.commentService.findAll(pagination, filter);
    }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.commentService.findOne(id);
    // }

    @ApiBearerAuth()
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body(new ValidationPipe()) dataDto: UpdateCommentDto,
    ) {
        return this.commentService.update(id, req.user.id, dataDto.content);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        const { role, id: userId } = req.user;

        const currentData = await this.commentService.findOne(id);

        const currentUserComment: boolean =
            role == Role.USER && currentData.userId != userId;

        if (!currentUserComment) {
            // superadmin & admin can delete
            if (![Role.SUPERADMIN, Role.ADMIN].includes(role)) {
                // if operator then check permission
                if (role == Role.OPERATOR) {
                    const hasPermission = await this.userService.hasPermission(
                        userId,
                        Module.COMMENT,
                        Permission.DELETE,
                    );
                    if (!hasPermission) throw new ForbiddenException();
                } else {
                    throw new ForbiddenException(
                        'Only the author can update his comment',
                    );
                }
            }
        }

        return this.commentService.remove(id);
    }

    // FOR ERVERYONE
    @ApiBearerAuth()
    @Post('react/:id')
    @HttpCode(204)
    react(
        @Request() req: any,
        @Param('id') commentId: string,
        @Body(new ValidationPipe()) reaction: ReactionQueryDto,
    ) {
        const { type } = reaction;

        return this.commentService.react(req.user.id, commentId, type);
    }
}
