import { PrismaClient } from '@prisma/client';

/**
 * Canonical category list for Followers Bicara.
 * Idempotent: safe to run on any environment; existing rows are updated
 * (name, description, sortOrder) but the slug is never changed.
 */
const CATEGORIES: Array<{
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
    showOnHome: boolean;
}> = [
    {
        name: 'Aqidah',
        slug: 'aqidah',
        description:
            'Pembahasan tentang tauhid, rukun iman, dan dasar-dasar keyakinan seorang muslim.',
        sortOrder: 10,
        showOnHome: true,
    },
    {
        name: 'Fiqih',
        slug: 'fiqih',
        description:
            'Hukum-hukum ibadah: thaharah, shalat, puasa, zakat, haji, dan yang terkait.',
        sortOrder: 20,
        showOnHome: true,
    },
    {
        name: 'Muamalah',
        slug: 'muamalah',
        description:
            'Fiqih mu\'amalah: jual beli, akad, riba, bisnis syariah, dan harta.',
        sortOrder: 30,
        showOnHome: true,
    },
    {
        name: 'Tafsir',
        slug: 'tafsir',
        description: 'Tafsir ayat Al-Qur\'an dan kajian kandungan surah.',
        sortOrder: 40,
        showOnHome: false,
    },
    {
        name: 'Hadits',
        slug: 'hadits',
        description:
            'Kajian hadits: matan, sanad, syarah, dan pelajaran dari sunnah Rasulullah ﷺ.',
        sortOrder: 50,
        showOnHome: false,
    },
    {
        name: 'Akhlaq & Adab',
        slug: 'akhlaq-adab',
        description:
            'Pembinaan akhlak, adab keseharian, nasihat, dan tazkiyatun nafs.',
        sortOrder: 60,
        showOnHome: false,
    },
    {
        name: 'Keluarga',
        slug: 'keluarga',
        description:
            'Pernikahan, parenting, hak & kewajiban suami-istri, pendidikan anak.',
        sortOrder: 70,
        showOnHome: true,
    },
    {
        name: 'Sejarah Islam',
        slug: 'sejarah-islam',
        description:
            'Sirah Nabi, para sahabat, khulafaur rasyidin, dan perjalanan umat Islam.',
        sortOrder: 80,
        showOnHome: false,
    },
    {
        name: 'Umum',
        slug: 'umum',
        description: 'Konten umum yang belum masuk kategori spesifik.',
        sortOrder: 999,
        showOnHome: false,
    },
];

export async function CategorySeed(prisma: PrismaClient) {
    for (const c of CATEGORIES) {
        await prisma.category.upsert({
            where: { slug: c.slug },
            update: {
                name: c.name,
                description: c.description,
                sortOrder: c.sortOrder,
                // showOnHome intentionally NOT in update — admin's choice
                // wins after first seed. New rows still get the default.
            },
            create: c,
        });
    }
    console.log(`✓ Seeded ${CATEGORIES.length} categories`);
}
