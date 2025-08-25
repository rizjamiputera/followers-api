import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Module, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<{
            module: string;
            permissions: string[];
        }>('permissions', context.getHandler());
        if (!requiredPermissions) return true; // No permission required

        const module = requiredPermissions.module as Module;
        const permissions = requiredPermissions.permissions;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException();
        }

        // ROLE IS GET FROM TOKEN, thats why it need to relogin
        // now I get user data from db
        const dataUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: {
                permissions: {
                    where: { module },
                    select: { permission: true }
                }
            }
        })

        // Allow superadmin and admin to access all modules
        // if ([Role.SUPERADMIN, Role.ADMIN].includes(user.role)) {
        //     return true;
        // }
        if (["SUPERADMIN", "ADMIN"].includes(dataUser.role)) {
            return true;
        }

        // Fetch user permissions from the database
        // const userPermissions = await this.prisma.userPermission.findMany({
        //     where: { userId: user.id, module },
        //     select: { permission: true },
        // });
        const userPermissions = dataUser.permissions;

        const hasPermission = userPermissions.some(({ permission }) =>
            permissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException('Permission denied');
        }

        return true;
    }
}
