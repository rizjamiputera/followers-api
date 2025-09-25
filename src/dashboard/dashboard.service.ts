import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    async getWebsiteOverview() {
        // Get current date ranges for analytics
        const now = new Date();
        const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfThisYear = new Date(now.getFullYear(), 0, 1);

        // Get visitor statistics
        const [
            totalVisitors,
            uniqueVisitors,
            totalVisits,
            visitsLast7Days,
            visitsLast24Hours,
            visitsToday,
            visitsThisMonth,
            visitsThisYear,
            visitorsToday,
            visitorsThisMonth,
            visitorsThisYear,
        ] = await Promise.all([
            this.prisma.visitor.count(),
            this.prisma.visitor.count({
                where: {
                    lastVisitAt: {
                        gte: thirtyDaysAgo,
                    },
                },
            }),
            this.prisma.visit.count(),
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: sevenDaysAgo,
                    },
                },
            }),
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: yesterday,
                    },
                },
            }),
            // New detailed visitor metrics
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: startOfToday,
                    },
                },
            }),
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: startOfThisMonth,
                    },
                },
            }),
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: startOfThisYear,
                    },
                },
            }),
            this.prisma.visitor.count({
                where: {
                    lastVisitAt: {
                        gte: startOfToday,
                    },
                },
            }),
            this.prisma.visitor.count({
                where: {
                    lastVisitAt: {
                        gte: startOfThisMonth,
                    },
                },
            }),
            this.prisma.visitor.count({
                where: {
                    lastVisitAt: {
                        gte: startOfThisYear,
                    },
                },
            }),
        ]);

        // Get content statistics
        const contentStats = await Promise.all([
            // Article statistics by status
            this.prisma.article.groupBy({
                by: ['status'],
                _count: {
                    id: true,
                },
                where: {
                    deleted: false,
                },
            }),
            // Event statistics by status
            this.prisma.event.groupBy({
                by: ['status'],
                _count: {
                    id: true,
                },
                where: {
                    deleted: false,
                },
            }),
            // Featured content count
            this.prisma.article.count({
                where: {
                    isFeatured: true,
                    deleted: false,
                },
            }),
            this.prisma.event.count({
                where: {
                    isFeatured: true,
                    deleted: false,
                },
            }),
        ]);

        // Get user statistics
        const userStats = await this.prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true,
            },
            where: {
                deleted: false,
            },
        });

        // Get engagement statistics
        const [
            totalComments,
            totalReactions,
            totalBookmarks,
            totalEventRegistrations,
        ] = await Promise.all([
            this.prisma.comment.count({
                where: {
                    deleted: false,
                },
            }),
            this.prisma.contentReaction.count(),
            this.prisma.articleBookmark.count(),
            this.prisma.eventRegistration.count(),
        ]);

        // Recent activity (last 7 days)
        const recentActivity = await Promise.all([
            this.prisma.article.count({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                    deleted: false,
                },
            }),
            this.prisma.event.count({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                    deleted: false,
                },
            }),
            this.prisma.comment.count({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                    deleted: false,
                },
            }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                    deleted: false,
                },
            }),
        ]);

        return {
            visitors: {
                total: totalVisitors,
                unique30Days: uniqueVisitors,
                totalVisits,
                visitsLast7Days,
                visitsLast24Hours,
                // Detailed visitor metrics
                today: {
                    visits: visitsToday,
                    visitors: visitorsToday,
                },
                thisMonth: {
                    visits: visitsThisMonth,
                    visitors: visitorsThisMonth,
                },
                thisYear: {
                    visits: visitsThisYear,
                    visitors: visitorsThisYear,
                },
            },
            content: {
                articles: contentStats[0].reduce(
                    (acc, curr) => ({
                        ...acc,
                        [curr.status.toLowerCase()]: curr._count.id,
                    }),
                    {
                        total: contentStats[0].reduce(
                            (sum, curr) => sum + curr._count.id,
                            0,
                        ),
                    },
                ),
                events: contentStats[1].reduce(
                    (acc, curr) => ({
                        ...acc,
                        [curr.status.toLowerCase()]: curr._count.id,
                    }),
                    {
                        total: contentStats[1].reduce(
                            (sum, curr) => sum + curr._count.id,
                            0,
                        ),
                    },
                ),
                featured: {
                    articles: contentStats[2],
                    events: contentStats[3],
                },
            },
            users: userStats.reduce(
                (acc, curr) => ({
                    ...acc,
                    [curr.role.toLowerCase()]: curr._count.id,
                }),
                {
                    total: userStats.reduce(
                        (sum, curr) => sum + curr._count.id,
                        0,
                    ),
                },
            ),
            engagement: {
                totalComments,
                totalReactions,
                totalBookmarks,
                totalEventRegistrations,
            },
            recentActivity: {
                newArticles: recentActivity[0],
                newEvents: recentActivity[1],
                newComments: recentActivity[2],
                newUsers: recentActivity[3],
            },
        };
    }

    async getTopPerformingContent(limit = 10) {
        // Get top articles by various metrics
        const [
            topArticlesByViews,
            topArticlesByReactions,
            topEventsByRegistrations,
        ] = await Promise.all([
            this.prisma.article.findMany({
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    publishedAt: true,
                    author: {
                        select: {
                            name: true,
                        },
                    },
                    stats: {
                        select: {
                            readCount: true,
                            likeCount: true,
                            commentCount: true,
                            shareCount: true,
                        },
                    },
                },
                where: {
                    status: ContentStatus.PUBLISHED,
                    deleted: false,
                },
                orderBy: {
                    stats: {
                        readCount: 'desc',
                    },
                },
                take: limit,
            }),
            this.prisma.article.findMany({
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    publishedAt: true,
                    author: {
                        select: {
                            name: true,
                        },
                    },
                    stats: {
                        select: {
                            readCount: true,
                            likeCount: true,
                            commentCount: true,
                            shareCount: true,
                        },
                    },
                },
                where: {
                    status: ContentStatus.PUBLISHED,
                    deleted: false,
                },
                orderBy: {
                    stats: {
                        likeCount: 'desc',
                    },
                },
                take: limit,
            }),
            this.prisma.event.findMany({
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    start_at: true,
                    location: true,
                    author: {
                        select: {
                            name: true,
                        },
                    },
                    registrations: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                    stats: {
                        select: {
                            readCount: true,
                            likeCount: true,
                            commentCount: true,
                        },
                    },
                },
                where: {
                    status: ContentStatus.PUBLISHED,
                    deleted: false,
                },
                orderBy: {
                    stats: {
                        readCount: 'desc',
                    },
                },
                take: limit,
            }),
        ]);

        return {
            topArticlesByViews,
            topArticlesByReactions,
            topEventsByRegistrations: topEventsByRegistrations.map((event) => ({
                ...event,
                registrationCount: event.registrations.length,
                confirmedRegistrations: event.registrations.filter(
                    (r) => r.status === 'CONFIRMED',
                ).length,
            })),
        };
    }

    async getCreatorStatistics(userId: string) {
        // Get current date ranges for creator analytics
        const now = new Date();
        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfThisYear = new Date(now.getFullYear(), 0, 1);

        // Get creator's content statistics and visitor analytics
        const [
            articleStats,
            eventStats,
            totalFollowers,
            // totalRatings,
            // Visitor analytics for creator's content
            contentVisitsToday,
            contentVisitsThisMonth,
            contentVisitsThisYear,
            totalContentVisits,
        ] = await Promise.all([
            this.prisma.article.groupBy({
                by: ['status'],
                _count: {
                    id: true,
                },
                where: {
                    authorId: userId,
                    deleted: false,
                },
            }),
            this.prisma.event.groupBy({
                by: ['status'],
                _count: {
                    id: true,
                },
                where: {
                    authorId: userId,
                    deleted: false,
                },
            }),
            this.prisma.follow.count({
                where: {
                    followingId: userId,
                },
            }),
            // this.prisma.userRating.findMany({
            //     where: {
            //         userId: userId,
            //     },
            //     select: {
            //         rating: true,
            //     },
            // }),
            // Get visits to creator's content - Today
            this.prisma.visit.count({
                where: {
                    AND: [
                        {
                            OR: [
                                {
                                    article: {
                                        authorId: userId,
                                        deleted: false,
                                    },
                                },
                                {
                                    event: {
                                        authorId: userId,
                                        deleted: false,
                                    },
                                },
                            ],
                        },
                        {
                            visitedAt: {
                                gte: startOfToday,
                            },
                        },
                    ],
                },
            }),
            // Get visits to creator's content - This Month
            this.prisma.visit.count({
                where: {
                    AND: [
                        {
                            OR: [
                                {
                                    article: {
                                        authorId: userId,
                                        deleted: false,
                                    },
                                },
                                {
                                    event: {
                                        authorId: userId,
                                        deleted: false,
                                    },
                                },
                            ],
                        },
                        {
                            visitedAt: {
                                gte: startOfThisMonth,
                            },
                        },
                    ],
                },
            }),
            // Get visits to creator's content - This Year
            this.prisma.visit.count({
                where: {
                    AND: [
                        {
                            OR: [
                                {
                                    article: {
                                        authorId: userId,
                                        deleted: false,
                                    },
                                },
                                {
                                    event: {
                                        authorId: userId,
                                        deleted: false,
                                    },
                                },
                            ],
                        },
                        {
                            visitedAt: {
                                gte: startOfThisYear,
                            },
                        },
                    ],
                },
            }),
            // Get total visits to creator's content - All Time
            this.prisma.visit.count({
                where: {
                    OR: [
                        {
                            article: {
                                authorId: userId,
                                deleted: false,
                            },
                        },
                        {
                            event: {
                                authorId: userId,
                                deleted: false,
                            },
                        },
                    ],
                },
            }),
        ]);

        // Get engagement metrics for creator's content
        const [articleEngagement, eventEngagement] = await Promise.all([
            this.prisma.article.findMany({
                select: {
                    id: true,
                    title: true,
                    publishedAt: true,
                    stats: {
                        select: {
                            readCount: true,
                            likeCount: true,
                            commentCount: true,
                            shareCount: true,
                            bookmarkCount: true,
                        },
                    },
                },
                where: {
                    authorId: userId,
                    deleted: false,
                },
            }),
            this.prisma.event.findMany({
                select: {
                    id: true,
                    title: true,
                    publishedAt: true,
                    registrations: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                    stats: {
                        select: {
                            readCount: true,
                            likeCount: true,
                            commentCount: true,
                            shareCount: true,
                        },
                    },
                },
                where: {
                    authorId: userId,
                    deleted: false,
                },
            }),
        ]);

        // Calculate total engagement
        const totalArticleViews = articleEngagement.reduce(
            (sum, article) => sum + article.stats.readCount,
            0,
        );
        const totalArticleLikes = articleEngagement.reduce(
            (sum, article) => sum + article.stats.likeCount,
            0,
        );
        const totalArticleComments = articleEngagement.reduce(
            (sum, article) => sum + article.stats.commentCount,
            0,
        );
        const totalArticleShares = articleEngagement.reduce(
            (sum, article) => sum + article.stats.shareCount,
            0,
        );
        const totalArticleBookmarks = articleEngagement.reduce(
            (sum, article) => sum + article.stats.bookmarkCount,
            0,
        );

        const totalEventViews = eventEngagement.reduce(
            (sum, event) => sum + event.stats.readCount,
            0,
        );
        const totalEventLikes = eventEngagement.reduce(
            (sum, event) => sum + event.stats.likeCount,
            0,
        );
        const totalEventComments = eventEngagement.reduce(
            (sum, event) => sum + event.stats.commentCount,
            0,
        );
        const totalEventShares = eventEngagement.reduce(
            (sum, event) => sum + event.stats.shareCount,
            0,
        );
        const totalEventRegistrations = eventEngagement.reduce(
            (sum, event) => sum + event.registrations.length,
            0,
        );

        // Calculate average rating
        // const averageRating =
        //     totalRatings.length > 0
        //         ? totalRatings.reduce((sum, r) => sum + r.rating, 0) /
        //         totalRatings.length
        //         : 0;

        return {
            content: {
                articles: articleStats.reduce(
                    (acc, curr) => ({
                        ...acc,
                        [curr.status.toLowerCase()]: curr._count.id,
                    }),
                    {
                        total: articleStats.reduce(
                            (sum, curr) => sum + curr._count.id,
                            0,
                        ),
                    },
                ),
                events: eventStats.reduce(
                    (acc, curr) => ({
                        ...acc,
                        [curr.status.toLowerCase()]: curr._count.id,
                    }),
                    {
                        total: eventStats.reduce(
                            (sum, curr) => sum + curr._count.id,
                            0,
                        ),
                    },
                ),
            },
            engagement: {
                totalViews: totalArticleViews + totalEventViews,
                totalLikes: totalArticleLikes + totalEventLikes,
                totalComments: totalArticleComments + totalEventComments,
                totalShares: totalArticleShares + totalEventShares,
                totalBookmarks: totalArticleBookmarks,
                totalEventRegistrations,
                // averageRating: parseFloat(averageRating.toFixed(2)),
            },
            social: {
                followers: totalFollowers,
                // ratingsCount: totalRatings.length,
            },
            visitors: {
                total: totalContentVisits,
                today: contentVisitsToday,
                thisMonth: contentVisitsThisMonth,
                thisYear: contentVisitsThisYear,
            },
            performance: {
                articles: articleEngagement.map((article) => ({
                    id: article.id,
                    title: article.title,
                    publishedAt: article.publishedAt,
                    metrics: article.stats,
                })),
                events: eventEngagement.map((event) => ({
                    id: event.id,
                    title: event.title,
                    publishedAt: event.publishedAt,
                    registrations: event.registrations.length,
                    confirmedRegistrations: event.registrations.filter(
                        (r) => r.status === 'CONFIRMED',
                    ).length,
                    metrics: event.stats,
                })),
            },
        };
    }

    async getActivityTimeline(limit = 20) {
        // Get recent activities across the platform
        const activities = [];

        // Recent articles
        const recentArticles = await this.prisma.article.findMany({
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                publishedAt: true,
                author: {
                    select: {
                        name: true,
                    },
                },
            },
            where: {
                deleted: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: Math.ceil(limit / 3),
        });

        // Recent events
        const recentEvents = await this.prisma.event.findMany({
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                publishedAt: true,
                start_at: true,
                author: {
                    select: {
                        name: true,
                    },
                },
            },
            where: {
                deleted: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: Math.ceil(limit / 3),
        });

        // Recent user registrations
        const recentUsers = await this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true,
                createdAt: true,
            },
            where: {
                deleted: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: Math.ceil(limit / 3),
        });

        // Combine and format activities
        recentArticles.forEach((article) => {
            activities.push({
                type: 'article',
                action:
                    article.status === ContentStatus.PUBLISHED
                        ? 'published'
                        : 'created',
                title: article.title,
                author: article.author.name,
                createdAt:
                    article.status === ContentStatus.PUBLISHED
                        ? article.publishedAt
                        : article.createdAt,
            });
        });

        recentEvents.forEach((event) => {
            activities.push({
                type: 'event',
                action:
                    event.status === ContentStatus.PUBLISHED
                        ? 'published'
                        : 'created',
                title: event.title,
                author: event.author.name,
                startAt: event.start_at,
                createdAt:
                    event.status === ContentStatus.PUBLISHED
                        ? event.publishedAt
                        : event.createdAt,
            });
        });

        recentUsers.forEach((user) => {
            activities.push({
                type: 'user',
                action: 'joined',
                title: `${user.name} (${user.role})`,
                createdAt: user.createdAt,
            });
        });

        // Sort by date and return limited results
        return activities
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            )
            .slice(0, limit);
    }

    async getPlatformGrowth() {
        // Get growth metrics for the last 30 days
        const now = new Date();

        // Get daily growth data
        const growthData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

            const [newUsers, newArticles, newEvents, newVisits] =
                await Promise.all([
                    this.prisma.user.count({
                        where: {
                            createdAt: {
                                gte: date,
                                lt: nextDate,
                            },
                            deleted: false,
                        },
                    }),
                    this.prisma.article.count({
                        where: {
                            createdAt: {
                                gte: date,
                                lt: nextDate,
                            },
                            deleted: false,
                        },
                    }),
                    this.prisma.event.count({
                        where: {
                            createdAt: {
                                gte: date,
                                lt: nextDate,
                            },
                            deleted: false,
                        },
                    }),
                    this.prisma.visit.count({
                        where: {
                            visitedAt: {
                                gte: date,
                                lt: nextDate,
                            },
                        },
                    }),
                ]);

            growthData.push({
                date: date.toISOString().split('T')[0],
                newUsers,
                newArticles,
                newEvents,
                newVisits,
            });
        }

        return growthData;
    }
}
