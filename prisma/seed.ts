import { PrismaClient } from '@prisma/client';
import { UserSeed } from './seeder/user-seeder';
import { ArticleSeed } from './seeder/article-seeder';
import { EventSeed } from './seeder/event-seeder';
import { EventRegistrationSeed } from './seeder/event-registration-seeder';
import { UserProductionSeed } from './seeder/production/user-production';
import { FollowSeed } from './seeder/follow-seeder';
import { ProfileSeed } from './seeder/profile-seeder';
const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === 'production') {
        await UserProductionSeed(prisma);
    } else {
        await UserSeed(prisma);
        await ArticleSeed(prisma);
        await EventSeed(prisma);
        await EventRegistrationSeed(prisma);
        await FollowSeed(prisma);
        await ProfileSeed(prisma);
        // await ContentReactionSeed(prisma);
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
