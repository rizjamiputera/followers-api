import { Injectable } from '@nestjs/common';
import { Article, ArticleContent, ArticleStatus, Prisma } from '@prisma/client';
import { AppService } from 'src/app.service';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate } from 'src/app/interface/app.interface';
import { PrismaService } from 'src/prisma.service';
import { FilterArticleQueryDto } from './dto/filter-article.dto';

interface CreateArticleInput {
    title: string;
    excerpt?: string;
    image: string;
    image_sm: string;
    slug: string;
    authorId: string;
    contentBody: any;
    isFeatured?: boolean;
    status?: ArticleStatus;
}

const VALID_INCLUDES = ['content', 'tags', 'comments', 'comments.replies', 'comments.reactions', 'reactions', 'versions', 'author'];

@Injectable()
export class ArticleService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    async create(data: CreateArticleInput): Promise<Article> {
        const { contentBody, authorId, ...articleData } = data;

        return this.prisma.article.create({
            data: {
                ...articleData,
                author: {
                    connect: { id: authorId }
                },
                content: {
                    create: {
                        content: contentBody
                    }
                },
                readStat: {
                    create: {}
                }
            }
        });
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterArticleQueryDto
    ): Promise<Paginate<Article[]>> {
        const { page, limit, sortBy, order, includes, deleted, search } =
            pagination;
        const { authorId, tags, status, published } = filter;
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        /**
         * Case-insensitive search
         * Search condition for:
         * - name
         * - phone
         * - address
         * - identity_no
         * - licence_no
         */
        const searchCondition: Prisma.ArticleWhereInput = search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { excerpt: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const whereConditions: Prisma.ArticleWhereInput[] = [
            searchCondition,
            { deleted }
        ];

        if (authorId) whereConditions.push({ authorId });
        if (status) whereConditions.push({ status });
        if (tags?.length > 0) {
            whereConditions.push({ tags: { some: { tag: { slug: { in: tags } } } } });
        }
        if (published) {
            whereConditions.push({
                status: ArticleStatus.PUBLISHED,
                publishedAt: { lte: new Date() }
            });
        }

        const where: Prisma.ArticleWhereInput = {
            AND: whereConditions.filter(condition => Object.keys(condition).length > 0)
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.article.count({ where }),
            this.prisma.article.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include,
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

    async findOne(id: string, includes: string[] = [],): Promise<Article> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        return this.prisma.article.findUniqueOrThrow({
            where: {
                id,
                deleted: false
            },
            include
        });
    }

    async update(
        id: string,
        data: Prisma.ArticleUpdateInput & { contentBody?: any }
    ): Promise<Article> {
        const current = await this.findOne(id, ['content']) as Article & { content?: ArticleContent };

        // Separate content body from article data
        const { contentBody, ...articleData } = data;

        // Check if content fields have changed
        const contentChanged = articleData.title !== current.title ||
            articleData.excerpt !== current.excerpt ||
            articleData.image !== current.image ||
            articleData.image_sm !== current.image_sm ||
            (contentBody && current.content &&
                JSON.stringify(contentBody) !== JSON.stringify(current.content.content));

        // Create version if content changed
        if (contentChanged && current.content) {
            await this.prisma.articleContentVersion.create({
                data: {
                    articleId: id,
                    title: current.title,
                    excerpt: current.excerpt,
                    image: current.image,
                    image_sm: current.image_sm,
                    content: current.content.content
                }
            });
        }

        // Update content if provided and changed
        if (contentBody && current.contentId && contentChanged) {
            await this.prisma.articleContent.update({
                where: { id: current.contentId },
                data: { content: contentBody }
            });
        }

        const update = await this.prisma.article.update({
            where: { id },
            data: articleData
        });

        return update;
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.article.update({
            where: { id },
            data: { deleted: true }
        });

        return;
    }
}
