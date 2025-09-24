import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

export async function FollowSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: Follow');

    const users = await prisma.user.findMany({
        where: {
            role: {
                in: ['OPERATOR', 'ADMIN']
            }
        }
    });

    if (users.length < 2) {
        console.log('Not enough users to create follow relationships. Need at least 2 users.');
        return;
    }

    const followPromises = [];

    for (const user of users) {
        const otherUsers = users.filter(u => u.id !== user.id);

        const followCount = faker.number.int({ min: 1, max: Math.min(5, otherUsers.length) });
        const usersToFollow = faker.helpers.arrayElements(otherUsers, followCount);

        for (const userToFollow of usersToFollow) {
            const existingFollow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: user.id,
                        followingId: userToFollow.id
                    }
                }
            });

            if (!existingFollow) {
                const followPromise = prisma.follow.create({
                    data: {
                        follower: {
                            connect: { id: user.id }
                        },
                        following: {
                            connect: { id: userToFollow.id }
                        }
                    }
                });

                followPromises.push(followPromise);
            }
        }
    }

    const follows = await Promise.all(followPromises);

    console.log(`Created ${follows.length} follow relationships`);
    console.log('\nSeed Finish: Follow');
}