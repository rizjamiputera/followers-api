import { PrismaClient } from '@prisma/client';
import { CategorySeed } from './seeder/category-seeder';

const prisma = new PrismaClient();

async function main() {
    // Canonical taxonomy — idempotent, seed in every environment.
    await CategorySeed(prisma);

    // Dev-only seeders. Lazy-loaded so deployed images (which only need
    // CategorySeed) don't have to ship these files.
    if (process.env.NODE_ENV === 'development') {
        const { UserSeed } = await import('./seeder/user-seeder');
        const { ArticleSeed } = await import('./seeder/article-seeder');
        const { EventSeed } = await import('./seeder/event-seeder');
        const { EventRegistrationSeed } = await import('./seeder/event-registration-seeder');
        await UserSeed(prisma);
        await ArticleSeed(prisma);
        await EventSeed(prisma);
        await EventRegistrationSeed(prisma);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
