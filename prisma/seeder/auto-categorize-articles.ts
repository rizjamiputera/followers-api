/**
 * One-time auto-categorizer for existing articles + events.
 * Safe to run repeatedly: only touches rows where categoryId IS NULL.
 *
 * Usage:
 *   pnpm tsx prisma/seeder/auto-categorize-articles.ts
 *
 * Matches title + excerpt against keyword heuristics per category.
 * First match wins; falls back to "Umum" if nothing matches.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Order matters — earlier entries get checked first. More specific
// topics before broader umbrella ones (e.g. Muamalah before Fiqih,
// because many muamalah articles also mention "fiqih").
const RULES: Array<{ slug: string; keywords: string[] }> = [
    {
        slug: 'muamalah',
        keywords: [
            'muamalah', 'muamalat', 'riba', 'jual beli', 'jualbeli', 'akad',
            'bisnis', 'dagang', 'utang', 'hutang', 'pinjam', 'deterjen',
            'najis', 'investasi', 'syirkah', 'kontrak',
        ],
    },
    {
        slug: 'keluarga',
        keywords: [
            'pernikahan', 'nikah', 'menikah', 'suami', 'istri', 'keluarga',
            'anak', 'parenting', 'orang tua', 'rumah tangga', 'mertua',
            'mahram', 'walimah', 'walimatul',
        ],
    },
    {
        slug: 'tafsir',
        keywords: [
            'tafsir', 'ayat', 'surah', 'surat al', 'al-qur\'an', 'al quran',
            'al-quran', 'alquran', 'qur\'an',
        ],
    },
    {
        slug: 'hadits',
        keywords: [
            'hadits', 'hadis', 'hadist', 'rawi', 'sanad', 'bukhari', 'muslim',
            'tirmidzi', 'an-nasai', 'nasa\'i', 'abu dawud', 'ibnu majah',
        ],
    },
    {
        slug: 'aqidah',
        keywords: [
            'aqidah', 'akidah', 'tauhid', 'iman', 'rukun iman', 'syirik',
            'kufur', 'nifaq', 'bid\'ah', 'bidah', 'tawassul', 'tabarruk',
        ],
    },
    {
        slug: 'sejarah-islam',
        keywords: [
            'sejarah', 'sirah', 'khulafaur', 'khulafa', 'sahabat', 'abu bakar',
            'umar bin khattab', 'utsman', 'ali bin abi', 'khilafah',
            'kerajaan islam', 'tabi\'in', 'tabiin',
        ],
    },
    {
        slug: 'akhlaq-adab',
        keywords: [
            'akhlak', 'akhlaq', 'adab', 'nasihat', 'nasehat', 'tazkiyatun',
            'tazkiyah', 'tawadhu', 'ikhlas', 'sabar', 'syukur', 'hati',
        ],
    },
    {
        slug: 'fiqih',
        keywords: [
            'fiqih', 'fiqh', 'fikih', 'shalat', 'sholat', 'salat', 'wudhu',
            'thaharah', 'bersuci', 'puasa', 'shaum', 'zakat', 'haji', 'umroh',
            'umrah', 'janabah', 'tayammum', 'ibadah',
        ],
    },
];

function pickCategorySlug(haystack: string): string {
    const text = haystack.toLowerCase();
    for (const rule of RULES) {
        if (rule.keywords.some(kw => text.includes(kw))) return rule.slug;
    }
    return 'umum';
}

async function main() {
    const categories = await prisma.category.findMany();
    const bySlug = new Map(categories.map(c => [c.slug, c]));

    for (const expectedSlug of [...RULES.map(r => r.slug), 'umum']) {
        if (!bySlug.has(expectedSlug)) {
            console.error(`Category '${expectedSlug}' missing — run CategorySeed first.`);
            process.exit(1);
        }
    }

    // ── Articles ──
    const articles = await prisma.article.findMany({
        where: { categoryId: null, deleted: false },
        select: { id: true, title: true, excerpt: true },
    });
    console.log(`Articles to categorize: ${articles.length}`);

    const perCat = new Map<string, number>();
    for (const a of articles) {
        const slug = pickCategorySlug(`${a.title} ${a.excerpt ?? ''}`);
        const cat = bySlug.get(slug)!;
        await prisma.article.update({
            where: { id: a.id },
            data: { categoryId: cat.id },
        });
        perCat.set(slug, (perCat.get(slug) ?? 0) + 1);
    }
    for (const [slug, n] of [...perCat.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${slug.padEnd(18)} ${n}`);
    }

    // ── Events ──
    const events = await prisma.event.findMany({
        where: { categoryId: null, deleted: false },
        select: { id: true, title: true, excerpt: true },
    });
    console.log(`\nEvents to categorize: ${events.length}`);

    const perCatEvt = new Map<string, number>();
    for (const e of events) {
        const slug = pickCategorySlug(`${e.title} ${e.excerpt ?? ''}`);
        const cat = bySlug.get(slug)!;
        await prisma.event.update({
            where: { id: e.id },
            data: { categoryId: cat.id },
        });
        perCatEvt.set(slug, (perCatEvt.get(slug) ?? 0) + 1);
    }
    for (const [slug, n] of [...perCatEvt.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${slug.padEnd(18)} ${n}`);
    }

    console.log('\nDone. Re-run safely — only touches rows with categoryId = NULL.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
