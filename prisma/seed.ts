import { PrismaClient } from '@prisma/client';
import { UserSeed } from './seeder/user-seeder';
import { ArticleSeed } from './seeder/article-seeder';
import { EventSeed } from './seeder/event-seeder';
import { EventRegistrationSeed } from './seeder/event-registration-seeder';
import { UserProductionSeed } from './seeder/production/user-production';
import { CategorySeed } from './seeder/category-seeder';
const prisma = new PrismaClient();

async function main() {
    // Canonical taxonomy — idempotent, seed in every environment.
    await CategorySeed(prisma);

    if (process.env.NODE_ENV === 'production') {
        await UserProductionSeed(prisma);
    } else {
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
