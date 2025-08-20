import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

import { Module, Permission, PrismaClient, Role } from '@prisma/client';

export async function UserSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: User');

    const password = await bcrypt.hash('rahasia', 10);
    const avatars: string[] = [
        '/dummy/avatar/avatar1.jpeg',
        '/dummy/avatar/avatar2.png',
        '/dummy/avatar/avatar3.jpeg',
        '/dummy/avatar/avatar4.jpg',
        '/dummy/avatar/avatar5.jpg',
        '/dummy/avatar/avatar6.png',
        '/dummy/avatar/avatar7.jpeg',
        '/dummy/avatar/avatar8.webp',
        '/dummy/avatar/avatar9.webp',
        '/dummy/avatar/avatar10.jpg',
        '/dummy/avatar/avatar11.webp',
    ]

    const promises = [];
    // Create 1 superadmin
    const superadmin_avatar = faker.helpers.arrayElement(avatars);
    console.log({ superadmin_avatar })
    promises.push(
        prisma.user.create({
            data: {
                name: 'Super Admin',
                email: 'superadmin@example.com',
                role: 'SUPERADMIN',
                avatar: superadmin_avatar,
                avatar_md: superadmin_avatar,
                password: {
                    create: {
                        password: password,
                    },
                },
            },
        }),
    );

    // Create 20 regular users
    for (let i = 1; i <= 20; i++) {
        const superadmin_user = faker.helpers.arrayElement(avatars);
        console.log({ superadmin_user })
        promises.push(
            prisma.user.create({
                data: {
                    name: faker.person.fullName(),
                    email: `user${i}@gmail.com`,
                    role: 'USER',
                    avatar: superadmin_user,
                    avatar_md: superadmin_user,
                    password: {
                        create: {
                            password: password,
                        },
                    },
                },
            }),
        );
    }

    // MODULES & PERMISSIONS
    const modules: Module[] = ['USER', 'ARTICLE', 'COMMENT'];
    const permissions: Permission[] = [
        'READ',
        'CREATE',
        'EDIT',
        'DELETE',
        'APPROVE',
    ];

    // Create 5 operators
    const roles: Role[] = ['OPERATOR', 'ADMIN'];
    roles.forEach((role) => {
        for (let i = 1; i <= 15; i++) {
            const superadmin_operator_admin = faker.helpers.arrayElement(avatars);
            console.log({ superadmin_operator_admin })
            promises.push(
                prisma.user.create({
                    data: {
                        name: faker.person.fullName(),
                        email: `${role.toLowerCase()}${i}@gmail.com`,
                        role,
                        avatar: superadmin_operator_admin,
                        avatar_md: superadmin_operator_admin,
                        password: {
                            create: {
                                password: password,
                            },
                        },
                        ...(role == 'OPERATOR' && {
                            permissions: {
                                createMany: {
                                    data: modules.flatMap((module) =>
                                        // Randomly select 2-4 permissions for each module
                                        faker.helpers
                                            .arrayElements(
                                                permissions,
                                                faker.number.int({
                                                    min: 2,
                                                    max: 4,
                                                }),
                                            )
                                            .map((permission) => ({
                                                module,
                                                permission,
                                            })),
                                    ),
                                },
                            },
                        }),
                    },
                }),
            );
        }
    });

    await Promise.all(promises);

    console.log(`Created 1 superadmin, 15 admin,15 operators, and 20 users`);
}
