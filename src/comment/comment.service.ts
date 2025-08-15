import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Comment, Prisma, ReactionType } from '@prisma/client';
import { AppService } from 'src/app.service';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate } from 'src/app/interface/app.interface';
import { FilterCommentQueryDto } from './dto/filter-comment.dto';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';

const VALID_INCLUDES = ['user', 'replies', 'reactions'];

@Injectable()
export class CommentService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    create(data: Prisma.CommentCreateInput): Promise<Comment> {
        return this.prisma.comment.create({ data });
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterCommentQueryDto
    ): Promise<Paginate<Comment[]>> {
        const { page, limit, sortBy, order, includes, deleted, search } =
            pagination;
        const { articleId, parentId } = filter;
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const searchCondition: Prisma.CommentWhereInput = search
            ? {
                OR: [
                    { content: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const whereConditions: Prisma.CommentWhereInput[] = [
            searchCondition,
            { deleted }
        ];

        if (articleId) whereConditions.push({ articleId });
        if (parentId) whereConditions.push({ parentId });

        const where: Prisma.CommentWhereInput = {
            AND: whereConditions.filter(condition => Object.keys(condition).length > 0)
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.comment.count({ where }),
            this.prisma.comment.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include: {
                    ...include,
                    ...(parentId && {
                        mentioned: true
                    })
                },
            }),
        ]);
        return {
            data,
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }

    async findOne(id: string, includes: string[] = [],): Promise<Comment> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        return this.prisma.comment.findUniqueOrThrow({
            where: {
                id,
                deleted: false
            },
            include
        });
    }

    async update(id: string, updateBy: string, content: string): Promise<Comment> {
        const currentData = await this.findOne(id);

        if (currentData.userId != updateBy) {
            throw new ForbiddenException('Only the author can update his comment');
        }

        return this.prisma.comment.update({
            where: { id },
            data: {
                content,
                isEdited: true
            }
        })

    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.comment.update({
            where: { id },
            data: { deleted: true }
        });

        return;
    }

    async react(userId: string, commentId: string, type: ReactionType): Promise<void> {
        const data: Prisma.CommentReactionCreateInput = {
            type,
            comment: { connect: { id: commentId } },
            user: { connect: { id: userId } }
        }
        await this.prisma.commentReaction.upsert({
            where: {
                commentId_userId: { commentId, userId },
            },
            update: data,
            create: data
        });

        return;
    }
}
