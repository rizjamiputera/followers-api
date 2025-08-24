import { PrismaClient } from '@prisma/client';
import { UserSeed } from './seeder/user-seeder';
import { ArticleSeed } from './seeder/article-seeder';
import { ArticleReactionSeed } from './seeder/article-reaction-seeder';
import { EventSeed } from './seeder/event-seeder';
import { EventReactionSeed } from './seeder/event-reaction-seeder';
const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === 'production') {
    } else {
        await UserSeed(prisma);
        await ArticleSeed(prisma);
        // await ArticleReactionSeed(prisma);
        await EventSeed(prisma);
        // await EventReactionSeed(prisma);
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
