import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Comment, Prisma, ReactionType } from '@prisma/client';
import { AppService } from 'src/app.service';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate } from 'src/app/interface/app.interface';
import { FilterCommentQueryDto } from './dto/filter-comment.dto';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';

const VALID_INCLUDES = ['user', 'replies', 'reactions'];
const transformImages = [
    'user.avatar',
    'user.avatar_md',
    'replies.user.avatar',
    'replies.user.avatar_md',
];
@Injectable()
export class CommentService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) {}

    async create(
        data: Prisma.CommentCreateInput,
        contentId: string,
        statsId: string,
        includes: string[] = [],
    ): Promise<Comment> {
        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        const comment = await this.prisma.comment.create({
            data,
            include,
        });

        const commentCount = await this.prisma.comment.count({
            where: { contentId, deleted: false },
        });

        await this.prisma.contentStats.update({
            where: { id: statsId },
            data: { commentCount },
        });

        return this.app.transformImageUrls(comment, ...transformImages);
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterCommentQueryDto,
    ): Promise<Paginate<Comment[]>> {
        const { page, limit, sortBy, order, includes, deleted, search } =
            pagination;
        const { contentId, parentId } = filter;

        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const searchCondition: Prisma.CommentWhereInput = search
            ? {
                  OR: [{ comment: { contains: search, mode: 'insensitive' } }],
              }
            : {};

        const whereConditions: Prisma.CommentWhereInput[] = [
            searchCondition,
            {
                parentId: parentId ? parentId : null,
                deleted,
            },
        ];

        if (contentId) whereConditions.push({ contentId });

        const where: Prisma.CommentWhereInput = {
            AND: whereConditions.filter(
                (condition) => Object.keys(condition).length > 0,
            ),
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
                    user: true,
                    ...(parentId && {
                        mentioned: true,
                    }),
                    ...(include.replies
                        ? {
                              replies: {
                                  include: {
                                      user: true,
                                      mentioned: true,
                                  },
                              },
                          }
                        : {}),
                },
            }),
        ]);
        return {
            data: this.app.transformImageUrls(data, ...transformImages),
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }

    async findOne(id: string, includes: string[] = []): Promise<Comment> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        return this.prisma.comment.findUniqueOrThrow({
            where: {
                id,
                deleted: false,
            },
            include,
        });
    }

    async update(
        id: string,
        updateBy: string,
        comment: string,
    ): Promise<Comment> {
        const currentData = await this.findOne(id);

        if (currentData.userId != updateBy) {
            throw new ForbiddenException(
                'Only the author can update his comment',
            );
        }

        return this.prisma.comment.update({
            where: { id },
            data: {
                comment,
                isEdited: true,
            },
        });
    }

    async remove(id: string): Promise<void> {
        const current = await this.findOne(id);

        // Soft-delete the comment and, if it's a top-level comment, its replies
        // too (replies are 1-level, so no deeper recursion needed).
        await this.prisma.comment.updateMany({
            where: { OR: [{ id }, { parentId: id }] },
            data: { deleted: true },
        });

        await this.syncCommentCount(current.contentId);

        return;
    }

    // Recompute the content's comment count from the non-deleted comments and
    // sync it onto the related article/event stats.
    private async syncCommentCount(contentId: string): Promise<void> {
        const commentCount = await this.prisma.comment.count({
            where: { contentId, deleted: false },
        });

        const article = await this.prisma.article.findUnique({
            where: { contentId },
            select: { statsId: true },
        });
        const statsId =
            article?.statsId ??
            (
                await this.prisma.event.findUnique({
                    where: { contentId },
                    select: { statsId: true },
                })
            )?.statsId;

        if (statsId) {
            await this.prisma.contentStats.update({
                where: { id: statsId },
                data: { commentCount },
            });
        }
    }

    async react(
        userId: string,
        commentId: string,
        type: ReactionType,
    ): Promise<void> {
        const data: Prisma.CommentReactionCreateInput = {
            type,
            comment: { connect: { id: commentId } },
            user: { connect: { id: userId } },
        };
        await this.prisma.commentReaction.upsert({
            where: {
                commentId_userId: { commentId, userId },
            },
            update: data,
            create: data,
        });

        return;
    }
}
