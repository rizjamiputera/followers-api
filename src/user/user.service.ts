import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Module, Permission, Prisma, Role, User } from '@prisma/client';
import { Paginate } from 'src/app/interface/app.interface';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { AppService } from 'src/app.service';
import { UserFilterQueryDto } from './dto/user-filter.dto';

// Define reusable includes
const VALID_INCLUDES = ['permissions'];

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    create(data: Prisma.UserCreateInput) {
        return this.prisma.user.create({ data });
    }

    async findAll(
        pagination: PaginationDeletedIncludeQueryDto,
        filter: UserFilterQueryDto,
        requester_role: Role,
        includes: string[] = [],
    ): Promise<Paginate<User[]>> {
        const { page, limit, sortBy, order, deleted } = pagination;

        const { role, active } = filter;

        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const where: Prisma.UserWhereInput = {
            AND: [
                { deleted },
                role ? { role } : {},
                ...(active !== undefined ? [{ active }] : []),
                requester_role == Role.ADMIN
                    ? { role: { not: Role.SUPERADMIN } }
                    : {},
            ],
        };

        const [total, data] = await Promise.all([
            this.prisma.user.count({
                where,
            }),
            this.prisma.user.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include,
            }),
        ]);

        return {
            data,
            limit,
            total,
            page,
            last_page: limit > 0 ? Math.ceil(total / limit) : 1,
        };
    }

    async update(
        updatedBy: string,
        updateByRole: Role,
        id: string,
        data: Prisma.UserUpdateInput,
    ): Promise<User> {
        const currentData = await this.findOne(id, updateByRole);

        if (!currentData) {
            throw new NotFoundException('User not found');
        }

        const update = await this.prisma.user.update({
            where: { id },
            data,
        });

        if (currentData.avatar != update.avatar) {
            this.app.removeFile(currentData.avatar);
            this.app.removeFile(currentData.avatar_md);
        }

        return update;
    }

    async change_password(userId: string, password: string): Promise<void> {
        await this.prisma.password.update({
            where: { userId },
            data: { password },
        });
        return;
    }

    async remove(
        updatedBy: string,
        deleteByRole: Role,
        id: string,
    ): Promise<void> {
        const currentData = await this.findOne(id, deleteByRole);

        if (!currentData) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.update({
            where: { id },
            data: {
                deleted: true,
            },
        });
        return;
    }

    async findUnique(id: string, includes: string[] = []): Promise<User> {
        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        const user = await this.prisma.user.findUnique({
            where: { id },
            include,
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        return user;
    }

    findOne(
        id: string,
        requester_role: Role,
        includes: string[] = [],
    ): Promise<User | null> {
        const include = this.app.getValidIncludes(
            VALID_INCLUDES,
            includes,
            false,
        );

        return this.prisma.user.findFirst({
            where: {
                AND: [
                    { id },
                    requester_role == Role.OPERATOR
                        ? { role: { notIn: [Role.SUPERADMIN, Role.ADMIN] } }
                        : requester_role == Role.ADMIN
                            ? { role: { not: Role.SUPERADMIN } }
                            : {},
                ],
            },
            include,
        });
    }

    async findByEmail(email: string): Promise<User> {
        email = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return user;
    }

    async addPermission(data: Prisma.UserPermissionCreateInput): Promise<void> {
        await this.prisma.userPermission.upsert({
            where: {
                userId_module_permission: {
                    userId: data.user.connect.id,
                    module: data.module,
                    permission: data.permission,
                },
            },
            update: data,
            create: data,
        });

        return;
    }

    async getPermission(userId: string, module?: Module) {
        return this.prisma.userPermission.findMany({
            where: {
                userId,
                ...(module && { module }),
            },
            select: { permission: true },
        });
    }

    async removePermission(id: string): Promise<void> {
        await this.prisma.userPermission.delete({ where: { id } });

        return;
    }

    async hasPermission(
        userId: string,
        module: Module,
        ...permissions: Permission[]
    ): Promise<boolean> {
        const userPermissions = await this.getPermission(userId, module);

        return userPermissions.some(({ permission }) =>
            permissions.includes(permission),
        );
    }
}
