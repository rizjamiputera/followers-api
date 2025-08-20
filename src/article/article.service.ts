import { ForbiddenException, Injectable } from '@nestjs/common';
import {
    Article,
    ArticleStatus,
    ArticleTag,
    Content,
    PhotoContent,
    Prisma,
    ReactionType,
    Tag,
} from '@prisma/client';
import { AppService } from 'src/app.service';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate } from 'src/app/interface/app.interface';
import { PrismaService } from 'src/prisma.service';
import { FilterArticleQueryDto } from './dto/filter-article.dto';

const VALID_INCLUDES = [
    'content',
    'tags.tag',
    'comments',
    'comments.replies',
    'comments.reactions',
    'reactions',
    'versions',
    'author',
    'stats',
];
const transformImages = ['image', 'image_sm', 'author.avatar', 'author.avatar_md'];

@Injectable()
export class ArticleService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    private transformData(data: Article & {
        tags?: (ArticleTag & { tag: Tag })[]
        content?: Content
    }): Article {
        const tags = data.tags;
        delete data.tags;

        const article = {
            ...data,
            ...(tags && {
                tags: tags.map(t => t.tag)
            })
        }

        const apiUri = process.env.API_URI || 'http://localhost:5111';

        if (article.content) {
            article.content.content['content'] = article.content.content['content'].map((c: any) => ({
                ...c,
                ...(c.type == 'image' && {
                    attrs: {
                        ...c.attrs,
                        src: apiUri + c.attrs.src
                    }
                })
            }))
        }

        return this.app.transformImageUrls(article, ...transformImages)
    }

    private transformDataArray(data: Article[]): Article[] {
        return data.map(article => this.transformData(article));
    }

    async is_slug_available(slug: string) {
        const exist = await this.prisma.article.findUnique({
            where: {
                slug,
            },
            select: { id: true },
        });

        return !exist;
    }

    async create(
        data: Prisma.ArticleCreateInput & { tags?: string[] },
    ): Promise<Article> {
        const { tags, ...articleData } = data;

        // Handle tags if provided
        let tagConnections:
            | Prisma.ArticleTagCreateNestedManyWithoutArticleInput
            | undefined;

        if (tags && tags.length > 0) {
            const createdTags = await this.createTags(tags);

            tagConnections = {
                create: createdTags.map((tag) => ({
                    tag: { connect: { id: tag.id } },
                })),
            };
        }

        return this.prisma.article.create({
            data: {
                ...articleData,
                ...(tagConnections && { tags: tagConnections }),
            },
        });
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: FilterArticleQueryDto,
    ): Promise<Paginate<Article[]>> {
        const { page, limit, sortBy, order, includes, deleted, search } =
            pagination;
        const { authorId, tags, status, published } = filter;
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

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
            { deleted },
        ];

        if (authorId) whereConditions.push({ authorId });
        if (status) whereConditions.push({ status });
        if (tags?.length > 0) {
            whereConditions.push({
                tags: { some: { tag: { slug: { in: tags } } } },
            });
        }
        if (published) {
            whereConditions.push({
                status: ArticleStatus.PUBLISHED,
                publishedAt: { lte: new Date() },
            });
        }

        const where: Prisma.ArticleWhereInput = {
            AND: whereConditions.filter(
                (condition) => Object.keys(condition).length > 0,
            ),
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
            data: this.transformDataArray(data),
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }

    async read(slug: string, includes: string[] = []): Promise<Article> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const article = await this.prisma.article.findUniqueOrThrow({
            where: {
                slug,
                status: ArticleStatus.PUBLISHED,
                publishedAt: { lte: new Date() },
                deleted: false,
            },
            include,
        });

        return this.transformData(article)
    }

    async findOne(id: string, includes: string[] = []): Promise<Article> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        const article = await this.prisma.article.findUniqueOrThrow({
            where: {
                id,
                deleted: false,
            },
            include,
        });

        return this.transformData(article)
    }

    async update(
        changedBy: string,
        id: string,
        data: Prisma.ArticleUpdateInput & {
            content?: any;
            tags?: string[];
        },
    ): Promise<Article> {
        const current = (await this.findOne(id, ['content'])) as Article & {
            content?: Content;
        };

        if (current.authorId !== changedBy) {
            throw new ForbiddenException(
                'Only the author can update this article',
            );
        }

        // Separate content body and tags from article data
        const { content, tags, ...articleData } = data;

        // Check if content fields have changed
        const contentChanged =
            articleData.title !== current.title ||
            articleData.excerpt !== current.excerpt ||
            articleData.image !== current.image ||
            articleData.image_sm !== current.image_sm ||
            (content && current.content &&
                (JSON.stringify(content) !== JSON.stringify(current.content.content)));

        // Create version if content changed
        if (contentChanged && current.content) {
            await this.prisma.contentVersion.create({
                data: {
                    article: { connect: { id } },
                    title: current.title,
                    excerpt: current.excerpt,
                    image: current.image,
                    image_sm: current.image_sm,
                    content: current.content.content,
                    createdAt: current.content.createdAt,
                },
            });
        }

        // Update content if provided and changed
        if (content && current.contentId && contentChanged) {
            // remove host url
            const apiUri = process.env.API_URI || 'http://localhost:5111';
            content.content = content.content.map((c: any) => ({
                ...c,
                ...(c.type == 'image' && {
                    attrs: {
                        ...c.attrs,
                        src: c.attrs.src.replace(apiUri, '')
                    }
                })
            }));

            await this.prisma.content.update({
                where: { id: current.contentId },
                data: { content: content },
            });

            // disconnet current photo
            await this.prisma.photoContent.updateMany({
                where: { articleId: id },
                data: { articleId: null }
            })

            const photoPaths = content.content.filter((c: any) => c.type == 'image').map((c: any) => c.attrs.src);
            // assign photo to article
            await this.prisma.photoContent.updateMany({
                where: {
                    path: {
                        in: photoPaths
                    }
                },
                data: {
                    articleId: id
                }
            })
        }

        // Handle tags update if provided
        let tagUpdate:
            | Prisma.ArticleTagUpdateManyWithoutArticleNestedInput
            | undefined;

        if (tags !== undefined) {
            if (tags.length === 0) {
                // Delete all tags
                tagUpdate = { deleteMany: {} };
            } else {
                const createdTags = await this.createTags(tags);

                // Delete existing tags and create new ones
                tagUpdate = {
                    deleteMany: {},
                    create: createdTags.map((tag) => ({
                        tag: { connect: { id: tag.id } },
                    })),
                };
            }
        }

        const update = await this.prisma.article.update({
            where: { id },
            data: {
                ...articleData,
                ...(tagUpdate && { tags: tagUpdate }),
            },
        });

        return this.transformData(update);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.article.update({
            where: { id },
            data: { deleted: true },
        });

        return;
    }

    async updateStatus(
        id: string,
        dataDto: Prisma.ArticleUpdateInput,
        approvalDto?: Prisma.ArticleApprovalCreateInput,
    ): Promise<void> {
        await this.findOne(id);

        await this.prisma.article.update({
            where: { id },
            data: {
                ...dataDto,
                ...(approvalDto && {
                    approvals: {
                        create: approvalDto,
                    },
                }),
            },
        });

        return;
    }

    async createTags(tags: string[]): Promise<Tag[]> {
        const processedTags = tags.map((tag) => {
            const lowerTag = tag.toLocaleLowerCase();
            return {
                name: lowerTag,
                slug: lowerTag.toLowerCase().replace(/\s+/g, '-'),
            };
        });

        // Upsert tags and get their data
        const tagPromises = processedTags.map((tag) =>
            this.prisma.tag.upsert({
                where: { slug: tag.slug },
                create: tag,
                update: {},
            }),
        );

        return Promise.all(tagPromises);
    }

    async react(
        userId: string,
        articleId: string,
        type: ReactionType,
    ): Promise<void> {
        const data: Prisma.ArticleReactionCreateInput = {
            type,
            article: { connect: { id: articleId } },
            user: { connect: { id: userId } },
        };
        await this.prisma.articleReaction.upsert({
            where: {
                articleId_userId: { articleId, userId },
            },
            update: data,
            create: data,
        });

        return;
    }
}
