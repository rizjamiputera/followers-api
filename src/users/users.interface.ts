import { Module, Permission, UserRole } from '@prisma/client';
import { Password } from 'src/auth/auth.interface';

export interface User {
    id: string;
    warehouseId?: string;
    role: UserRole;
    name: string;
    email: string;
    password?: Password;
    active: boolean;
    deleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    permissions?: UserPermission[];
}

export interface UserPermission {
    id: string;
    user?: User;
    userId: string;
    module: Module;
    permission: Permission;
}
