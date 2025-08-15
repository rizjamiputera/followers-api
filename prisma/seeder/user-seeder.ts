import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

import { Module, Permission, PrismaClient, Role } from "@prisma/client";

export async function UserSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: User');

    const password = await bcrypt.hash('rahasia', 10);

    const promises = [];
    // Create 1 superadmin
    promises.push(prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'superadmin@example.com',
            role: 'SUPERADMIN',
            avatar: faker.image.avatar(),
            password: {
                create: {
                    password: password
                }
            }
        }
    }));

    // Create 20 regular users
    for (let i = 1; i <= 20; i++) {
        promises.push(prisma.user.create({
            data: {
                name: faker.person.fullName(),
                email: `user${i}@gmail.com`,
                role: 'USER',
                avatar: faker.image.avatar(),
                password: {
                    create: {
                        password: password
                    }
                }
            }
        }));
    }

    // MODULES & PERMISSIONS
    const modules: Module[] = ['USER', 'ARTICLE', 'COMMENT'];
    const permissions: Permission[] = ['READ', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'PUBLISH'];

    // Create 5 operators
    const roles: Role[] = ['OPERATOR', 'ADMIN'];
    roles.forEach(role => {
        for (let i = 1; i <= 5; i++) {
            promises.push(prisma.user.create({
                data: {
                    name: faker.person.fullName(),
                    email: `${role.toLowerCase()}${i}@gmail.com`,
                    role,
                    avatar: faker.image.avatar(),
                    password: {
                        create: {
                            password: password
                        }
                    },
                    ...(role == 'OPERATOR' && {
                        permissions: {
                            createMany: {
                                data: modules.flatMap(module =>
                                    // Randomly select 2-4 permissions for each module
                                    faker.helpers.arrayElements(permissions, faker.number.int({ min: 2, max: 4 }))
                                        .map(permission => ({
                                            module,
                                            permission
                                        }))
                                )
                            }
                        }
                    })
                }
            }));
        }
    })

    await Promise.all(promises);

    console.log(`Created 1 superadmin, 5 admin,5 operators, and 20 users`);
}
