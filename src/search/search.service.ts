import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { AppService } from '../app.service';
import { PrismaService } from '../prisma.service';

const ARTICLE_IMAGE_KEYS = [
    'image',
    'image_md',
    'author.avatar',
    'author.avatar_md',
];

const EVENT_IMAGE_KEYS = [
    'image',
    'image_md',
    'image_portrait',
    'image_portrait_md',
    'author.avatar',
    'author.avatar_md',
];

@Injectable()
export class SearchService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    async search(q: string, limit: number) {
        const query = (q || '').trim();
        if (!query) return { articles: [], events: [] };

        const take = Math.min(Math.max(limit || 10, 1), 50);

        const articleWhere: Prisma.ArticleWhereInput = {
            deleted: false,
            status: ContentStatus.PUBLISHED,
            publishedAt: { lte: new Date() },
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
            ],
        };

        const eventWhere: Prisma.EventWhereInput = {
            deleted: false,
            status: ContentStatus.PUBLISHED,
            publishedAt: { lte: new Date() },
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
            ],
        };

        const [articles, events] = await Promise.all([
            this.prisma.article.findMany({
                where: articleWhere,
                orderBy: { publishedAt: 'desc' },
                take,
                include: {
                    author: { select: { id: true, name: true, username: true, avatar: true, avatar_md: true } },
                    category: { select: { id: true, name: true, slug: true } },
                },
            }),
            this.prisma.event.findMany({
                where: eventWhere,
                orderBy: { publishedAt: 'desc' },
                take,
                include: {
                    author: { select: { id: true, name: true, username: true, avatar: true, avatar_md: true } },
                    category: { select: { id: true, name: true, slug: true } },
                },
            }),
        ]);

        return {
            articles: articles.map((a) =>
                this.app.transformImageUrls(a, ...ARTICLE_IMAGE_KEYS),
            ),
            events: events.map((e) =>
                this.app.transformImageUrls(e, ...EVENT_IMAGE_KEYS),
            ),
        };
    }
}
