import { faker } from '@faker-js/faker';

import { PrismaClient, User, Article, ReactionType, Content, Event } from '@prisma/client';

interface ContentWithArticleOrEvent extends Content {
    article?: Article
    event?: Event
}

export async function ContentReactionSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: Content Reactions & Comments');

    // Get all published articles
    const contents: ContentWithArticleOrEvent[] = await prisma.content.findMany({
        where: {
            OR: [
                {
                    article: { status: 'PUBLISHED' }
                },
                {
                    event: { status: 'PUBLISHED' }
                },
            ]
        },
        include: {
            article: true,
            event: true
        }
    });

    // Get all users (excluding operators and admins to simulate real user engagement)
    const users: User[] = await prisma.user.findMany({
        where: {
            role: 'USER',
        },
    });

    if (contents.length === 0 || users.length === 0) {
        console.log(
            'No published articles, events or users found. Please run article and user seeders first.',
        );
        return;
    }

    const contentReactionTypes: ReactionType[] = ['like', 'dislike'];
    const commentReactionTypes: ReactionType[] = ['like', 'dislike'];
    // const commentReactionTypes: ReactionType[] = ['like', 'dislike', 'love', 'clap'];
    const bookmarkPromises = [];
    const reactionPromises = [];
    const commentPromises = [];

    // Create reactions and comments for each article
    for (const content of contents) {
        const { article, event } = content;
        const publishedAt = article ? article.publishedAt : event.publishedAt;
        // Create random reactions (30-80% of users react to each article)
        const reactionCount = faker.number.int({
            min: Math.floor(users.length * 0.3),
            max: Math.floor(users.length * 0.8),
        });

        // bookmark
        const bookmarkUsers = faker.helpers.arrayElements(users, users.length);
        if (article != null)
            for (const user of bookmarkUsers) {
                bookmarkPromises.push(
                    prisma.articleBookmark.create({
                        data: {
                            article: {
                                connect: { id: article.id },
                            },
                            user: {
                                connect: { id: user.id },
                            },
                        },
                    }),
                );
            }

        // react
        const reactingUsers = faker.helpers.arrayElements(users, reactionCount);

        for (const user of reactingUsers) {
            const reactionType = faker.helpers.arrayElement(contentReactionTypes);

            reactionPromises.push(
                prisma.contentReaction.create({
                    data: {
                        ...(article && {
                            article: {
                                connect: { id: article.id },
                            },
                        }),
                        ...(event && {
                            event: {
                                connect: { id: event.id },
                            },
                        }),
                        user: {
                            connect: { id: user.id },
                        },
                        type: reactionType,
                        createdAt: faker.date.between({
                            from: publishedAt,
                            to: new Date(),
                        }),
                    },
                }),
            );
        }

        // Create top-level comments (5-15 comments per content)
        const commentCount = faker.number.int({ min: 5, max: 100 });

        for (let i = 0; i < commentCount; i++) {
            const commentingUsers = faker.helpers.arrayElement(users);
            // const user = commentingUsers[i];
            const commentCreatedAt = faker.date.between({
                from: publishedAt,
                to: new Date(),
            });

            commentPromises.push(
                prisma.comment
                    .create({
                        data: {
                            content: {
                                connect: { id: content.id },
                            },
                            user: {
                                connect: { id: commentingUsers.id },
                            },
                            comment: generateCommentContent(),
                            isEdited: faker.datatype.boolean(0.1), // 10% chance of being edited
                            createdAt: commentCreatedAt,
                            updatedAt: faker.datatype.boolean(0.1)
                                ? faker.date.between({
                                    from: commentCreatedAt,
                                    to: new Date(),
                                })
                                : commentCreatedAt,
                        },
                    })
                    .then(async (comment) => {
                        // Create replies to some comments (40% chance, 1-5 replies each)
                        // All replies point directly to the top-level comment (2-level only)
                        if (faker.datatype.boolean(0.4)) {
                            const replyCount = faker.number.int({
                                min: 1,
                                max: 5,
                            });
                            const replyPromises = [];

                            for (let j = 0; j < replyCount; j++) {
                                const replyUser =
                                    faker.helpers.arrayElement(users);
                                const replyCreatedAt = faker.date.between({
                                    from: comment.createdAt,
                                    to: new Date(),
                                });

                                // 30% chance to mention someone (simulating reply to another reply)
                                const shouldMention =
                                    faker.datatype.boolean(0.7);
                                const mentionedUser = shouldMention
                                    ? faker.helpers.arrayElement(
                                        users.filter(
                                            (u) => u.id !== replyUser.id,
                                        ),
                                    )
                                    : null;

                                replyPromises.push(
                                    prisma.comment
                                        .create({
                                            data: {
                                                content: {
                                                    connect: { id: content.id },
                                                },
                                                user: {
                                                    connect: {
                                                        id: replyUser.id,
                                                    },
                                                },
                                                parent: {
                                                    connect: { id: comment.id },
                                                },
                                                mentioned: mentionedUser
                                                    ? {
                                                        connect: {
                                                            id: mentionedUser.id,
                                                        },
                                                    }
                                                    : undefined,
                                                comment: generateReplyContent(
                                                    mentionedUser?.name,
                                                ),
                                                isEdited:
                                                    faker.datatype.boolean(
                                                        0.05,
                                                    ), // 5% chance of being edited
                                                createdAt: replyCreatedAt,
                                                updatedAt:
                                                    faker.datatype.boolean(0.05)
                                                        ? faker.date.between({
                                                            from: replyCreatedAt,
                                                            to: new Date(),
                                                        })
                                                        : replyCreatedAt,
                                            },
                                        })
                                        .then(async (reply) => {
                                            // Add reactions to replies (25% chance, 1-5 loves per reply)
                                            if (faker.datatype.boolean(0.25)) {
                                                // 25% chance
                                                const replyLoveCount =
                                                    faker.number.int({
                                                        min: 1,
                                                        max: 5,
                                                    });
                                                const replyLovingUsers =
                                                    faker.helpers.arrayElements(
                                                        users,
                                                        replyLoveCount,
                                                    );

                                                const replyReactionPromises =
                                                    replyLovingUsers.map(
                                                        (lovingUser) =>
                                                            prisma.commentReaction.create(
                                                                {
                                                                    data: {
                                                                        comment:
                                                                        {
                                                                            connect:
                                                                            {
                                                                                id: reply.id,
                                                                            },
                                                                        },
                                                                        user: {
                                                                            connect:
                                                                            {
                                                                                id: lovingUser.id,
                                                                            },
                                                                        },
                                                                        type: faker.helpers.arrayElement(
                                                                            commentReactionTypes,
                                                                        ),
                                                                        createdAt:
                                                                            faker.date.between(
                                                                                {
                                                                                    from: reply.createdAt,
                                                                                    to: new Date(),
                                                                                },
                                                                            ),
                                                                    },
                                                                },
                                                            ),
                                                    );

                                                await Promise.all(
                                                    replyReactionPromises,
                                                );
                                            }

                                            return reply;
                                        }),
                                );
                            }

                            // Execute replies in batches
                            for (let k = 0; k < replyPromises.length; k += 5) {
                                const replyBatch = replyPromises.slice(k, k + 5);
                                await Promise.all(replyBatch);
                            }
                        }

                        // Add reactions to comments (20-50% chance, 1-8 loves per comment)
                        if (faker.datatype.boolean(0.35)) {
                            // 35% chance
                            const loveCount = faker.number.int({
                                min: 1,
                                max: 8,
                            });
                            const lovingUsers = faker.helpers.arrayElements(
                                users,
                                loveCount,
                            );

                            const commentReactionPromises = lovingUsers.map(
                                (lovingUser) =>
                                    prisma.commentReaction.create({
                                        data: {
                                            comment: {
                                                connect: { id: comment.id },
                                            },
                                            user: {
                                                connect: { id: lovingUser.id },
                                            },
                                            type: faker.helpers.arrayElement(
                                                commentReactionTypes,
                                            ),
                                            createdAt: faker.date.between({
                                                from: comment.createdAt,
                                                to: new Date(),
                                            }),
                                        },
                                    }),
                            );

                            await Promise.all(commentReactionPromises);
                        }

                        return comment;
                    }),
            );
        }
    }

    // Execute reactions in batches to avoid connection pool exhaustion
    const BATCH_SIZE = 10;
    let reactionCount = 0;
    for (let i = 0; i < bookmarkPromises.length; i += BATCH_SIZE) {
        const batch = bookmarkPromises.slice(i, i + BATCH_SIZE);
        await Promise.all(batch);
        reactionCount += batch.length;
    }

    for (let i = 0; i < reactionPromises.length; i += BATCH_SIZE) {
        const batch = reactionPromises.slice(i, i + BATCH_SIZE);
        await Promise.all(batch);
        reactionCount += batch.length;
    }
    console.log(`Created ${reactionCount} content reactions`);

    // Execute comments in batches to avoid connection pool exhaustion
    let commentCount = 0;
    for (let i = 0; i < commentPromises.length; i += BATCH_SIZE) {
        const batch = commentPromises.slice(i, i + BATCH_SIZE);
        await Promise.all(batch);
        commentCount += batch.length;
    }


    for (const content of contents) {

        const commentCount = await prisma.comment.count({
            where: { contentId: content.id }
        })

        let statsId = null;
        let likeCount = 0;
        let dislikeCount = 0;
        if (content.article != null) {
            statsId = content.article.statsId;
            likeCount = await prisma.contentReaction.count({
                where: {
                    AND: [
                        { articleId: content.article.id },
                        { type: 'like' }
                    ]
                }
            });
            dislikeCount = await prisma.contentReaction.count({
                where: {
                    AND: [
                        { articleId: content.article.id },
                        { type: 'dislike' }
                    ]
                }
            });
        }

        if (content.event != null) {
            statsId = content.event.statsId;
            likeCount = await prisma.contentReaction.count({
                where: {
                    AND: [
                        { eventId: content.event.id },
                        { type: 'like' }
                    ]
                }
            });

            dislikeCount = await prisma.contentReaction.count({
                where: {
                    AND: [
                        { eventId: content.event.id },
                        { type: 'dislike' }
                    ]
                }
            });
        }

        if (statsId != null) {
            await prisma.contentStats.update({
                where: { id: statsId },
                data: {
                    commentCount,
                    likeCount,
                    dislikeCount
                }
            })
        }
    }

    console.log(
        `Created ${commentCount} comments with replies and comment reactions`,
    );

    // Count total comment reactions created
    const totalCommentReactions = await prisma.commentReaction.count();
    console.log(`Total comment reactions (loves): ${totalCommentReactions}`);

    console.log('\nSeed End: Content Reactions & Comments');
}

function generateCommentContent(): string {
    const commentTypes = [
        // Positive comments
        () => `Great article! ${faker.lorem.sentence()}`,
        () => `This is really helpful. ${faker.lorem.sentences(2)}`,
        () => `Thanks for sharing this insight. ${faker.lorem.sentence()}`,
        () => `Excellent explanation! ${faker.lorem.sentence()}`,
        () => `I learned a lot from this. ${faker.lorem.sentences(1, ' ')}`,

        // Questions
        () =>
            `Can you explain more about ${faker.lorem.words(3)}? ${faker.lorem.sentence()}`,
        () =>
            `What do you think about ${faker.lorem.words(2)} in this context?`,
        () => `How does this compare to ${faker.lorem.words(3)}?`,

        // Technical discussions
        () => `I've tried this approach and ${faker.lorem.sentence()}`,
        () => `In my experience, ${faker.lorem.sentences(2)}`,
        () => `One thing to consider is ${faker.lorem.sentence()}`,

        // General comments
        () => faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
    ];

    return faker.helpers.arrayElement(commentTypes)();
}

function generateReplyContent(mentionedName?: string): string {
    const replyTypes = [
        // Agreements
        () => `I agree! ${faker.lorem.sentence()}`,
        () => `Exactly my thoughts. ${faker.lorem.sentence()}`,
        () => `Yes, that's a good point.`,

        // Additions
        () => `Also, ${faker.lorem.sentence()}`,
        () => `To add to that, ${faker.lorem.sentence()}`,
        () => `Another thing is ${faker.lorem.sentence()}`,

        // Answers
        () => `Good question! ${faker.lorem.sentence()}`,
        () => `Here's what I think: ${faker.lorem.sentence()}`,

        // Short responses
        () => 'Thanks for the clarification!',
        () => 'That makes sense.',
        () => 'Interesting perspective.',
        () => faker.lorem.sentence(),
    ];

    // If mentioning someone, add @ mention to the content
    const baseContent = faker.helpers.arrayElement(replyTypes)();

    if (mentionedName) {
        return `@${mentionedName} ${baseContent}`;
    }

    return baseContent;
}
