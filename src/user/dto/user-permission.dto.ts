import { ApiProperty } from '@nestjs/swagger';
import { Module, Permission } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class UserPermissionDto {
    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty({
        description: 'Module Name',
        enum: Module,
        enumName: 'Module',
    })
    @IsEnum(Module)
    module: Module;

    @ApiProperty({
        description: 'Permission Name',
        enum: Permission,
        enumName: 'Permission',
    })
    @IsEnum(Permission)
    permission: Permission;
}
