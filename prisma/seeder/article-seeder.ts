import { faker } from '@faker-js/faker';

import { ContentStatus, PrismaClient, User } from '@prisma/client';

export async function ArticleSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: Article');

    const operators: User[] = await prisma.user.findMany({
        where: {
            role: 'OPERATOR',
        },
    });

    const admins: User[] = await prisma.user.findMany({
        where: {
            role: 'ADMIN',
        },
    });

    if (operators.length === 0 || admins.length === 0) {
        console.log(
            'No operators or admins found. Please run user seeder first.',
        );
        return;
    }

    // Create tags first
    const tagNames = [
        'quran',
        'hadith',
        'tafsir',
        'fiqh',
        'aqidah',
        'shariah',
        'seerah',
        'prophets',
        'sahabah',
        'islamic history',
        'dua',
        'dhikr',
        'prayer',
        'fasting',
        'zakat',
        'hajj',
        'umrah',
        'halal',
        'haram',
        'islamic ethics',
        'akhlaq',
        'family in islam',
        'marriage',
        'parenting',
        'youth in islam',
        'women in islam',
        'islamic finance',
        'business ethics',
        'islamic lifestyle',
        'modesty',
        'hijab',
        'sunnah',
        'contemporary issues',
        'interfaith',
        'dawah',
        'islamic art & culture',
    ];

    const tagPromises = tagNames.map((name) =>
        prisma.tag.upsert({
            where: { slug: faker.helpers.slugify(name).toLowerCase() },
            update: {},
            create: {
                name,
                slug: faker.helpers.slugify(name).toLowerCase(),
            },
        }),
    );

    const tags = await Promise.all(tagPromises);
    console.log(`Created/found ${tags.length} tags`);

    const articlePromises = [];

    // Create articles for each operator
    const articleCount = 10;
    for (const operator of operators) {
        for (let i = 0; i < articleCount; i++) {
            const title = faker.lorem.sentence({ min: 4, max: 8 });
            const slug = faker.helpers.slugify(title).toLowerCase();
            const content = generateStructuredContent();
            const status = faker.helpers.arrayElement<ContentStatus>([
                'DRAFT',
                'ON_REVIEW',
                'PUBLISHED',
            ]);

            // Random schedule and publish dates
            // const scheduledAt = faker.helpers.maybe(() => faker.date.future(), { probability: 0.6 });
            const createdAt = faker.date.past();
            // const publishedAt = status === 'PUBLISHED' ? faker.date.past() : null;
            const publishedAt = faker.date.between({
                from: createdAt,
                to: new Date(),
            });

            const articlePromise = (async () => {
                const image = `/dummy/article/article${faker.number.int({ min: 1, max: 13 })}.jpg`;
                // First create the article content
                const articleContent = await prisma.content.create({
                    data: {
                        content,
                    },
                });

                // Create read stats first
                const readStat = await prisma.contentStats.create({
                    data: {
                        readCount: faker.number.int({ min: 0, max: 1000 }),
                        lastReadAt: faker.helpers.maybe(
                            () => faker.date.past(),
                            { probability: 0.8 },
                        ),
                    },
                });

                // Then create the article with reference to content and readStat
                const article = await prisma.article.create({
                    data: {
                        title,
                        excerpt: faker.lorem.paragraph({ min: 1, max: 3 }),
                        image,
                        image_md: image,
                        slug: `${slug}-${faker.string.nanoid(6)}`, // Ensure uniqueness
                        content: {
                            connect: { id: articleContent.id },
                        },
                        stats: {
                            connect: { id: readStat.id },
                        },
                        isFeatured: faker.datatype.boolean(0.2), // 20% chance of being featured
                        status,
                        publishedAt,
                        author: {
                            connect: { id: operator.id },
                        },
                    },
                });
                // Create random number of approvals (1-3) by random admins
                const randomAdmin = faker.helpers.arrayElement(admins);
                const approvalCount = faker.number.int({ min: 1, max: 3 });
                const approvalPromises = [];

                for (let j = 0; j < approvalCount; j++) {
                    const approvalStatus = faker.helpers.arrayElement([
                        'PUBLISHED',
                        'REJECTED',
                    ] as const);
                    const approvalCreatedAt = faker.date.between({
                        from: createdAt,
                        to: publishedAt,
                    });

                    approvalPromises.push(
                        prisma.contentApproval.create({
                            data: {
                                article: {
                                    connect: { id: article.id },
                                },
                                approver: {
                                    connect: { id: randomAdmin.id },
                                },
                                status: approvalStatus,
                                note: faker.helpers.maybe(
                                    () => faker.lorem.paragraph(),
                                    { probability: 0.7 },
                                ),
                                createdAt: approvalCreatedAt,
                            },
                        }),
                    );

                    if (approvalStatus === 'PUBLISHED') break;
                }

                await Promise.all(approvalPromises);

                // Add random tags to the article (2-5 tags per article)
                const selectedTags = faker.helpers.arrayElements(tags, {
                    min: 2,
                    max: 5,
                });
                const tagPromises = selectedTags.map((tag) =>
                    prisma.contentTag.create({
                        data: {
                            article: {
                                connect: { id: article.id },
                            },
                            tag: {
                                connect: { id: tag.id },
                            },
                        },
                    }),
                );

                await Promise.all(tagPromises);
                return article;
            })();

            articlePromises.push(articlePromise);
        }
    }

    await Promise.all(articlePromises);

    console.log(
        `Created ${operators.length * articleCount} articles with content, approvals, and read stats`,
    );
    console.log('\nSeed End: Article');
}

function generateStructuredContent() {
    return {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: faker.lorem.sentence() }],
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: faker.lorem.paragraphs(2) }],
            },
            // Add random image after first paragraph
            faker.helpers.maybe(
                () => {
                    const src = `/dummy/article/article${faker.number.int({ min: 1, max: 13 })}.jpg`
                    return {
                        type: 'image',
                        attrs: {
                            src,
                            alt: faker.lorem.words(3),
                            title: faker.lorem.sentence(),
                        },
                    }
                },
                { probability: 0.8 },
            ),
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: faker.lorem.sentence() }],
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: faker.lorem.paragraphs(2) }],
            },
            // Add another random image
            faker.helpers.maybe(
                () => {
                    const src = `/dummy/article/article${faker.number.int({ min: 1, max: 13 })}.jpg`
                    return {
                        type: 'image',
                        attrs: {
                            src,
                            alt: faker.lorem.words(4),
                            title: faker.lorem.sentence(),
                            caption: faker.lorem.sentence(),
                        },
                    }
                },
                { probability: 0.6 },
            ),
            {
                type: 'paragraph',
                content: [{ type: 'text', text: faker.lorem.paragraph() }],
            },
            {
                type: 'bulletList',
                content: Array.from(
                    { length: faker.number.int({ min: 3, max: 6 }) },
                    () => ({
                        type: 'listItem',
                        content: [
                            {
                                type: 'paragraph',
                                content: [
                                    {
                                        type: 'text',
                                        text: faker.lorem.sentence(),
                                    },
                                ],
                            },
                        ],
                    }),
                ),
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: faker.lorem.paragraphs(2) }],
            },
            // Add final image with different dimensions
            faker.helpers.maybe(
                () => {
                    const src = `/dummy/article/article${faker.number.int({ min: 1, max: 13 })}.jpg`
                    return {
                        type: 'image',
                        attrs: {
                            src,
                            alt: faker.lorem.words(5),
                            title: faker.lorem.sentence(),
                            caption: faker.lorem.sentence(),
                            width: 1200,
                            height: 600,
                        },
                    }
                },
                { probability: 0.7 },
            ),
            {
                type: 'paragraph',
                content: [{ type: 'text', text: faker.lorem.paragraphs(1) }],
            },
        ].filter(Boolean), // Remove null/undefined items from maybe() calls
    };
}
