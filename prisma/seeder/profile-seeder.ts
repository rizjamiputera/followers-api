import { faker } from '@faker-js/faker';
import { PrismaClient, SocialPlatform } from '@prisma/client';

export async function ProfileSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: Profile');

    const users = await prisma.user.findMany({
        where: {
            role: {
                in: ['OPERATOR', 'ADMIN']
            }
        },
        include: {
            profile: true
        }
    });

    if (users.length === 0) {
        console.log('No operators or admins found. Please run user seeder first.');
        return;
    }

    const profilePromises = [];

    for (const user of users) {
        // Skip if user already has a profile
        if (user.profile) {
            continue;
        }

        const profilePromise = (async () => {
            // Create biography content using the same structure as articles
            const biographyContent = await prisma.content.create({
                data: {
                    content: generateBiographyContent(),
                },
            });

            // Generate a unique slug
            const baseSlug = faker.helpers.slugify(user.name).toLowerCase();
            const slug = `${baseSlug}-${faker.string.nanoid(4)}`;

            // Create the profile
            const profile = await prisma.profile.create({
                data: {
                    user: {
                        connect: { id: user.id }
                    },
                    slug,
                    biography: {
                        connect: { id: biographyContent.id }
                    },
                    specializations: faker.helpers.arrayElements([
                        'Quran',
                        'Hadith',
                        'Fiqh',
                        'Tafsir',
                        'Sejarah Islam',
                        'Aqidah',
                        'Akhlaq',
                        'Sunnah',
                        'Dakwah',
                        'Syariah'
                    ], { min: 2, max: 5 }),
                    isPublic: faker.datatype.boolean(0.7),
                },
            });

            // Create some social links
            const socialPlatforms = [
                SocialPlatform.INSTAGRAM,
                SocialPlatform.FACEBOOK,
                SocialPlatform.TWITTER,
                SocialPlatform.YOUTUBE,
                SocialPlatform.TELEGRAM,
                SocialPlatform.WEBSITE
            ];

            const selectedPlatforms = faker.helpers.arrayElements(socialPlatforms, { min: 1, max: 4 });

            const socialLinkPromises = selectedPlatforms.map(platform => {
                let url: string;
                let handle: string;

                switch (platform) {
                    case SocialPlatform.INSTAGRAM:
                        handle = `@${faker.internet.username()}`;
                        url = `https://instagram.com/${handle.substring(1)}`;
                        break;
                    case SocialPlatform.FACEBOOK:
                        handle = faker.internet.username();
                        url = `https://facebook.com/${handle}`;
                        break;
                    case SocialPlatform.TWITTER:
                        handle = `@${faker.internet.username()}`;
                        url = `https://twitter.com/${handle.substring(1)}`;
                        break;
                    case SocialPlatform.YOUTUBE:
                        handle = `@${faker.internet.username()}`;
                        url = `https://youtube.com/${handle}`;
                        break;
                    case SocialPlatform.TELEGRAM:
                        handle = `@${faker.internet.username()}`;
                        url = `https://t.me/${handle.substring(1)}`;
                        break;
                    case SocialPlatform.WEBSITE:
                        handle = faker.internet.domainName();
                        url = `https://${handle}`;
                        break;
                    default:
                        handle = faker.internet.username();
                        url = faker.internet.url();
                }

                return prisma.socialLink.create({
                    data: {
                        profile: {
                            connect: { id: profile.id }
                        },
                        platform,
                        url,
                        handle,
                    },
                });
            });

            await Promise.all(socialLinkPromises);

            return profile;
        })();

        profilePromises.push(profilePromise);
    }

    const profiles = await Promise.all(profilePromises);

    console.log(`Created ${profiles.length} profiles with biographies and social links`);

    console.log('\nUpdating profile statistics...');

    const updateStatsPromises = users.map(async (user) => {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id }
        });

        if (!profile) return null;

        const [totalArticles, totalFollowers] = await Promise.all([
            prisma.article.count({
                where: {
                    authorId: user.id,
                    status: 'PUBLISHED'
                }
            }),
            prisma.follow.count({
                where: {
                    followingId: user.id
                }
            })
        ]);

        return prisma.profile.update({
            where: { id: profile.id },
            data: {
                totalArticles,
                totalFollowers
            }
        });
    });

    await Promise.all(updateStatsPromises);

    console.log('Profile statistics updated successfully');
    console.log('\nSeed Finish: Profile');
}

function generateBiographyContent() {
    const islamicTerms = [
        'Al-Quran', 'Hadith', 'Sunnah', 'Fiqh', 'Tafsir', 'Aqidah',
        'Syariah', 'Dakwah', 'Akhlaq', 'Ibadah', 'Ulama', 'Ustadz'
    ];

    const educationBackground = faker.helpers.arrayElement([
        'lulusan Pondok Pesantren',
        'sarjana Studi Islam',
        'magister Ilmu Al-Quran dan Tafsir',
        'doktor Studi Islam',
        'alumni Universitas Al-Azhar',
        'santri senior'
    ]);

    const expertise = faker.helpers.arrayElements(islamicTerms, { min: 2, max: 4 }).join(', ');

    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: `Assalamu'alaikum warahmatullahi wabarakatuh. Saya adalah ${educationBackground} yang memiliki minat mendalam dalam bidang ${expertise}.`
                    }
                ],
            },
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: faker.lorem.paragraphs(2) + ` Saya telah mempelajari ilmu agama selama ${faker.number.int({ min: 5, max: 20 })} tahun dan aktif dalam kegiatan dakwah serta pendidikan Islam.`
                    }
                ],
            },
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: `Spesialisasi saya meliputi ${expertise}. Semoga tulisan-tulisan yang saya bagikan dapat memberikan manfaat bagi umat Islam dan menjadi amal jariyah yang berkah.`
                    }
                ],
            },
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: 'Barakallahu fiikum. Wallahu a\'lam bishawab.'
                    }
                ],
            },
        ],
    };
}
