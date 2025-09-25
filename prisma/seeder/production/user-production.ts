import * as bcrypt from 'bcrypt';

import { PrismaClient } from '@prisma/client';

export async function UserProductionSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: User');

    const password = await bcrypt.hash('rahasia', 10);

    // Create 1 superadmin
    await prisma.user.create({
        data: {
            name: 'Super Uda',
            email: 'rizjamiputera@gmail.com',
            username: 'super_uda',
            role: 'SUPERADMIN',
            password: {
                create: {
                    password: password,
                },
            },
        },
    });

    console.log(`Created 1 superadmin`);
}
