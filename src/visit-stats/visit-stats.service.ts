import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class VisitStatsService {
    constructor(private prisma: PrismaService) {}

    async getVisitAnalytics(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        // This week and last week calculations
        const dayOfWeek = now.getDay();
        const startOfThisWeek = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
        const startOfLastWeek = new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000));

        // This month and last month calculations
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Get visit metrics
        const [
            totalVisits,
            visitsToday,
            visitsYesterday,
            visitsThisWeek,
            visitsLastWeek,
            visitsThisMonth,
            visitsLastMonth,
            uniqueVisitorsTotal,
            uniqueVisitorsToday,
            uniqueVisitorsYesterday,
            uniqueVisitorsThisWeek,
            uniqueVisitorsLastWeek,
            uniqueVisitorsThisMonth,
            uniqueVisitorsLastMonth,
        ] = await Promise.all([
            // Total visits
            this.prisma.visit.count({
                where: { visitedAt: { gte: startDate } }
            }),
            // Today's visits
            this.prisma.visit.count({
                where: { visitedAt: { gte: startOfToday } }
            }),
            // Yesterday's visits
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: startOfYesterday,
                        lt: startOfToday
                    }
                }
            }),
            // This week's visits
            this.prisma.visit.count({
                where: { visitedAt: { gte: startOfThisWeek } }
            }),
            // Last week's visits
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: startOfLastWeek,
                        lt: startOfThisWeek
                    }
                }
            }),
            // This month's visits
            this.prisma.visit.count({
                where: { visitedAt: { gte: startOfThisMonth } }
            }),
            // Last month's visits
            this.prisma.visit.count({
                where: {
                    visitedAt: {
                        gte: startOfLastMonth,
                        lt: endOfLastMonth
                    }
                }
            }),
            // Unique visitors - total
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: { gte: startDate },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
            // Unique visitors - today
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: { gte: startOfToday },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
            // Unique visitors - yesterday
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: {
                        gte: startOfYesterday,
                        lt: startOfToday
                    },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
            // Unique visitors - this week
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: { gte: startOfThisWeek },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
            // Unique visitors - last week
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: {
                        gte: startOfLastWeek,
                        lt: startOfThisWeek
                    },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
            // Unique visitors - this month
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: { gte: startOfThisMonth },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
            // Unique visitors - last month
            this.prisma.visit.groupBy({
                by: ['visitorId'],
                where: {
                    visitedAt: {
                        gte: startOfLastMonth,
                        lt: endOfLastMonth
                    },
                    visitorId: { not: null }
                }
            }).then(result => result.length),
        ]);

        // Calculate growth rates
        const visitsGrowthRate = visitsLastMonth > 0
            ? ((visitsThisMonth - visitsLastMonth) / visitsLastMonth) * 100
            : 0;

        const uniqueVisitorsGrowthRate = uniqueVisitorsLastMonth > 0
            ? ((uniqueVisitorsThisMonth - uniqueVisitorsLastMonth) / uniqueVisitorsLastMonth) * 100
            : 0;

        // Calculate average visits per visitor
        const avgVisitsPerVisitor = uniqueVisitorsTotal > 0
            ? totalVisits / uniqueVisitorsTotal
            : 0;

        return {
            visits: {
                total: totalVisits,
                today: visitsToday,
                yesterday: visitsYesterday,
                thisWeek: visitsThisWeek,
                lastWeek: visitsLastWeek,
                thisMonth: visitsThisMonth,
                lastMonth: visitsLastMonth,
                growthRate: Math.round(visitsGrowthRate * 100) / 100,
            },
            uniqueVisitors: {
                total: uniqueVisitorsTotal,
                today: uniqueVisitorsToday,
                yesterday: uniqueVisitorsYesterday,
                thisWeek: uniqueVisitorsThisWeek,
                lastWeek: uniqueVisitorsLastWeek,
                thisMonth: uniqueVisitorsThisMonth,
                lastMonth: uniqueVisitorsLastMonth,
                growthRate: Math.round(uniqueVisitorsGrowthRate * 100) / 100,
            },
            averageSessionDuration: 0, // Would need session tracking to calculate
            bounceRate: 0, // Would need page view tracking to calculate
            avgVisitsPerVisitor: Math.round(avgVisitsPerVisitor * 100) / 100,
        };
    }

    async getVisitorAnalytics(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Get visitor demographics
        const [
            totalVisitors,
            registeredVisitors,
            dailyVisitorCounts
        ] = await Promise.all([
            this.prisma.visitor.count({
                where: {
                    lastVisitAt: { gte: startDate }
                }
            }),
            this.prisma.visitor.count({
                where: {
                    lastVisitAt: { gte: startDate },
                    userId: { not: null }
                }
            }),
            // Daily active visitors for the period
            this.getDailyVisitorCounts(days)
        ]);

        // Calculate new vs returning visitors
        const firstTimeVisitors = await this.prisma.visitor.count({
            where: {
                firstVisitAt: { gte: startDate },
                lastVisitAt: { gte: startDate }
            }
        });

        const returningVisitors = totalVisitors - firstTimeVisitors;

        return {
            demographics: {
                totalVisitors,
                newVisitors: firstTimeVisitors,
                returningVisitors,
                registeredUsers: registeredVisitors,
                anonymousUsers: totalVisitors - registeredVisitors,
            },
            dailyActiveVisitors: dailyVisitorCounts,
            visitorRetention: {
                day1: 0, // Would need more complex calculation
                day7: 0,
                day30: 0,
            }
        };
    }

    async getTopPages(limit: number = 20, days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const topPages = await this.prisma.visit.groupBy({
            by: ['path'],
            _count: {
                id: true,
            },
            where: {
                visitedAt: { gte: startDate }
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: limit,
        });

        // Get unique visitors per page
        const pagesWithDetails = await Promise.all(
            topPages.map(async (page) => {
                const uniqueVisitors = await this.prisma.visit.groupBy({
                    by: ['visitorId'],
                    where: {
                        path: page.path,
                        visitedAt: { gte: startDate },
                        visitorId: { not: null }
                    }
                });

                // Try to get content details if it's an article or event page
                let title = null;
                let contentType = null;

                if (page.path.startsWith('/articles/') || page.path.startsWith('/events/')) {
                    const pathParts = page.path.split('/');
                    const slug = pathParts[pathParts.length - 1];

                    if (page.path.startsWith('/articles/')) {
                        contentType = 'article';
                        const article = await this.prisma.article.findFirst({
                            where: { slug },
                            select: { title: true }
                        });
                        title = article?.title;
                    } else if (page.path.startsWith('/events/')) {
                        contentType = 'event';
                        const event = await this.prisma.event.findFirst({
                            where: { slug },
                            select: { title: true }
                        });
                        title = event?.title;
                    }
                }

                return {
                    path: page.path,
                    visits: page._count.id,
                    uniqueVisitors: uniqueVisitors.length,
                    title,
                    contentType,
                    avgTimeOnPage: 0, // Would need session tracking
                };
            })
        );

        return {
            pages: pagesWithDetails,
            totalPages: topPages.length,
        };
    }

    async getVisitTimeline(days: number = 30, interval: 'hour' | 'day' | 'week' = 'day') {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        let timelineData = [];

        if (interval === 'day') {
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

                const [visits, uniqueVisitors] = await Promise.all([
                    this.prisma.visit.count({
                        where: {
                            visitedAt: {
                                gte: date,
                                lt: nextDate
                            }
                        }
                    }),
                    this.prisma.visit.groupBy({
                        by: ['visitorId'],
                        where: {
                            visitedAt: {
                                gte: date,
                                lt: nextDate
                            },
                            visitorId: { not: null }
                        }
                    }).then(result => result.length)
                ]);

                timelineData.push({
                    timestamp: date.toISOString().split('T')[0],
                    visits,
                    uniqueVisitors,
                    pageViews: visits, // Same as visits for now
                });
            }
        }

        return {
            timeline: timelineData,
            interval,
            totalDataPoints: timelineData.length,
        };
    }

    async getTopReferrers(limit: number = 20, days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const referrers = await this.prisma.visit.groupBy({
            by: ['referrer'],
            _count: {
                id: true,
            },
            where: {
                visitedAt: { gte: startDate },
                AND: [
                    { referrer: { not: null } },
                    { referrer: { not: '' } }
                ]
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: limit,
        });

        const directTraffic = await this.prisma.visit.count({
            where: {
                visitedAt: { gte: startDate },
                OR: [
                    { referrer: null },
                    { referrer: '' }
                ]
            }
        });

        const totalVisits = await this.prisma.visit.count({
            where: { visitedAt: { gte: startDate } }
        });

        const referrersWithDetails = await Promise.all(
            referrers.map(async (ref) => {
                const uniqueVisitors = await this.prisma.visit.groupBy({
                    by: ['visitorId'],
                    where: {
                        referrer: ref.referrer,
                        visitedAt: { gte: startDate },
                        visitorId: { not: null }
                    }
                });

                return {
                    referrer: ref.referrer,
                    visits: ref._count.id,
                    uniqueVisitors: uniqueVisitors.length,
                    percentage: Math.round((ref._count.id / totalVisits) * 10000) / 100,
                };
            })
        );

        return {
            referrers: referrersWithDetails,
            directTraffic,
            totalReferrers: referrers.length,
        };
    }

    async getUserAgentAnalytics(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const userAgents = await this.prisma.visit.findMany({
            where: {
                visitedAt: { gte: startDate },
                userAgent: { not: null }
            },
            select: {
                userAgent: true
            }
        });

        // Parse user agents (simplified parsing)
        const browserCounts = {};
        const deviceCounts = {};
        const osCounts = {};

        userAgents.forEach(({ userAgent }) => {
            if (!userAgent) return;

            // Simple browser detection
            let browser = 'Unknown';
            if (userAgent.includes('Chrome')) browser = 'Chrome';
            else if (userAgent.includes('Firefox')) browser = 'Firefox';
            else if (userAgent.includes('Safari')) browser = 'Safari';
            else if (userAgent.includes('Edge')) browser = 'Edge';

            // Simple device detection
            let device = 'Desktop';
            if (userAgent.includes('Mobile')) device = 'Mobile';
            else if (userAgent.includes('Tablet')) device = 'Tablet';

            // Simple OS detection
            let os = 'Unknown';
            if (userAgent.includes('Windows')) os = 'Windows';
            else if (userAgent.includes('Mac')) os = 'macOS';
            else if (userAgent.includes('Linux')) os = 'Linux';
            else if (userAgent.includes('Android')) os = 'Android';
            else if (userAgent.includes('iOS')) os = 'iOS';

            browserCounts[browser] = (browserCounts[browser] || 0) + 1;
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
            osCounts[os] = (osCounts[os] || 0) + 1;
        });

        const totalAnalyzed = userAgents.length;

        const formatCounts = (counts: Record<string, number>) => {
            return Object.entries(counts)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([name, visits]) => ({
                    name,
                    visits: visits as number,
                    percentage: Math.round(((visits as number) / totalAnalyzed) * 10000) / 100,
                }));
        };

        return {
            browsers: formatCounts(browserCounts),
            devices: formatCounts(deviceCounts),
            operatingSystems: formatCounts(osCounts),
            totalAnalyzed,
        };
    }

    private async getDailyVisitorCounts(days: number) {
        const now = new Date();
        const counts = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

            const count = await this.prisma.visitor.count({
                where: {
                    lastVisitAt: {
                        gte: date,
                        lt: nextDate
                    }
                }
            });

            counts.push({
                date: date.toISOString().split('T')[0],
                count
            });
        }

        return counts;
    }

    // Visitor Journey Analytics Methods

    async getVisitorJourneys(days: number = 30, limit: number = 20, page: number = 1) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await this.prisma.visitor.count({
            where: {
                firstVisitAt: {
                    gte: startDate,
                },
                fingerprint: {
                    not: null,
                },
            },
        });

        // Get visitors with their complete journey paths and user information
        const visitors = await this.prisma.visitor.findMany({
            where: {
                firstVisitAt: {
                    gte: startDate,
                },
                fingerprint: {
                    not: null,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                visits: {
                    where: {
                        visitedAt: {
                            gte: startDate,
                        },
                    },
                    orderBy: {
                        visitedAt: 'asc',
                    },
                    select: {
                        path: true,
                        visitedAt: true,
                    },
                },
            },
            orderBy: {
                lastVisitAt: 'desc',
            },
            skip,
            take: limit,
        });

        const journeys = visitors.map(visitor => ({
            fingerprint: visitor.fingerprint,
            firstVisitAt: visitor.firstVisitAt,
            lastVisitAt: visitor.lastVisitAt,
            totalPages: visitor.visits.length,
            user: visitor.user ? {
                id: visitor.user.id,
                name: visitor.user.name,
                username: visitor.user.username,
                email: visitor.user.email,
            } : null,
            path: visitor.visits.map(visit => ({
                page: visit.path,
                timestamp: visit.visitedAt,
            })),
            sessionDuration: visitor.visits.length > 0 ?
                new Date(visitor.lastVisitAt).getTime() - new Date(visitor.firstVisitAt).getTime() : 0,
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return {
            journeys,
            totalJourneys: totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    async getPathFlow(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Get sequential visits by visitors
        const visitors = await this.prisma.visitor.findMany({
            where: {
                firstVisitAt: {
                    gte: startDate,
                },
                fingerprint: {
                    not: null,
                },
            },
            include: {
                visits: {
                    where: {
                        visitedAt: {
                            gte: startDate,
                        },
                    },
                    orderBy: {
                        visitedAt: 'asc',
                    },
                    select: {
                        path: true,
                        visitedAt: true,
                    },
                },
            },
        });

        // Build path flow matrix
        const pathTransitions: { [key: string]: { [key: string]: number } } = {};
        const pageCounts: { [key: string]: number } = {};

        visitors.forEach(visitor => {
            const visits = visitor.visits;

            visits.forEach((visit, index) => {
                // Count page visits
                pageCounts[visit.path] = (pageCounts[visit.path] || 0) + 1;

                // Count transitions
                if (index < visits.length - 1) {
                    const fromPath = visit.path;
                    const toPath = visits[index + 1].path;

                    if (!pathTransitions[fromPath]) {
                        pathTransitions[fromPath] = {};
                    }

                    pathTransitions[fromPath][toPath] = (pathTransitions[fromPath][toPath] || 0) + 1;
                }
            });
        });

        // Convert to array format for visualization
        const flows = [];
        Object.entries(pathTransitions).forEach(([fromPath, transitions]) => {
            Object.entries(transitions).forEach(([toPath, count]) => {
                flows.push({
                    from: fromPath,
                    to: toPath,
                    value: count,
                });
            });
        });

        // Sort flows by value descending
        flows.sort((a, b) => b.value - a.value);

        return {
            flows: flows.slice(0, 50), // Top 50 transitions
            totalTransitions: flows.length,
            pageCounts,
        };
    }

    async getVisitorFunnels(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Common funnel paths to analyze
        const funnels = [
            {
                name: 'Article Engagement',
                steps: ['/', '/articles', '/articles/*'],
            },
            {
                name: 'Event Discovery',
                steps: ['/', '/events', '/events/*'],
            },
            {
                name: 'User Registration',
                steps: ['/', '/register', '/cp'],
            },
        ];

        const results = [];

        for (const funnel of funnels) {
            const stepResults = [];

            for (let stepIndex = 0; stepIndex < funnel.steps.length; stepIndex++) {
                const stepPattern = funnel.steps[stepIndex];
                let visitors = new Set();

                if (stepIndex === 0) {
                    // First step: count all visitors who visited this path
                    const visits = await this.prisma.visit.findMany({
                        where: {
                            visitedAt: {
                                gte: startDate,
                            },
                            path: stepPattern === '/' ? '/' : {
                                startsWith: stepPattern.replace('*', ''),
                            },
                            visitor: {
                                fingerprint: {
                                    not: null,
                                },
                            },
                        },
                        select: {
                            visitor: {
                                select: {
                                    fingerprint: true,
                                },
                            },
                        },
                    });

                    visits.forEach(visit => {
                        if (visit.visitor?.fingerprint) {
                            visitors.add(visit.visitor.fingerprint);
                        }
                    });
                } else {
                    // Subsequent steps: only count visitors from previous step who also did this step
                    const prevStepVisitors = stepResults[stepIndex - 1].visitors;

                    for (const fingerprint of prevStepVisitors) {
                        const hasVisited = await this.prisma.visit.findFirst({
                            where: {
                                visitedAt: {
                                    gte: startDate,
                                },
                                path: stepPattern === '*' ? {} : stepPattern.includes('*') ? {
                                    startsWith: stepPattern.replace('*', ''),
                                } : stepPattern,
                                visitor: {
                                    fingerprint,
                                },
                            },
                        });

                        if (hasVisited) {
                            visitors.add(fingerprint);
                        }
                    }
                }

                stepResults.push({
                    step: funnel.steps[stepIndex],
                    visitors: Array.from(visitors),
                    count: visitors.size,
                    dropoffRate: stepIndex > 0 ?
                        ((stepResults[stepIndex - 1].count - visitors.size) / stepResults[stepIndex - 1].count * 100) : 0,
                });
            }

            results.push({
                name: funnel.name,
                steps: stepResults.map(step => ({
                    step: step.step,
                    count: step.count,
                    dropoffRate: step.dropoffRate,
                })),
            });
        }

        return {
            funnels: results,
        };
    }

    async getEntryExitPages(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Get entry pages (first page visited by each visitor)
        const entryPages = await this.prisma.visit.findMany({
            where: {
                visitedAt: {
                    gte: startDate,
                },
                visitor: {
                    fingerprint: {
                        not: null,
                    },
                },
            },
            select: {
                path: true,
                visitor: {
                    select: {
                        fingerprint: true,
                        firstVisitAt: true,
                    },
                },
                visitedAt: true,
            },
        });

        // Group by visitor and find first visit per visitor
        const visitorEntries: { [key: string]: { path: string; visitedAt: Date } } = {};
        entryPages.forEach(visit => {
            const fingerprint = visit.visitor?.fingerprint;
            if (fingerprint) {
                if (!visitorEntries[fingerprint] || visit.visitedAt < visitorEntries[fingerprint].visitedAt) {
                    visitorEntries[fingerprint] = {
                        path: visit.path,
                        visitedAt: visit.visitedAt,
                    };
                }
            }
        });

        // Count entry pages
        const entryPageCounts: { [key: string]: number } = {};
        Object.values(visitorEntries).forEach(entry => {
            entryPageCounts[entry.path] = (entryPageCounts[entry.path] || 0) + 1;
        });

        // Get exit pages (last page visited by each visitor)
        const exitPages = await this.prisma.visit.findMany({
            where: {
                visitedAt: {
                    gte: startDate,
                },
                visitor: {
                    fingerprint: {
                        not: null,
                    },
                },
            },
            select: {
                path: true,
                visitor: {
                    select: {
                        fingerprint: true,
                        lastVisitAt: true,
                    },
                },
                visitedAt: true,
            },
        });

        // Group by visitor and find last visit per visitor
        const visitorExits: { [key: string]: { path: string; visitedAt: Date } } = {};
        exitPages.forEach(visit => {
            const fingerprint = visit.visitor?.fingerprint;
            if (fingerprint) {
                if (!visitorExits[fingerprint] || visit.visitedAt > visitorExits[fingerprint].visitedAt) {
                    visitorExits[fingerprint] = {
                        path: visit.path,
                        visitedAt: visit.visitedAt,
                    };
                }
            }
        });

        // Count exit pages
        const exitPageCounts: { [key: string]: number } = {};
        Object.values(visitorExits).forEach(exit => {
            exitPageCounts[exit.path] = (exitPageCounts[exit.path] || 0) + 1;
        });

        // Convert to sorted arrays
        const topEntryPages = Object.entries(entryPageCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        const topExitPages = Object.entries(exitPageCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        return {
            entryPages: topEntryPages,
            exitPages: topExitPages,
            totalUniqueVisitors: Object.keys(visitorEntries).length,
        };
    }
}