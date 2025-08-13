import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UserFilterQueryDto {
    @ApiPropertyOptional({ description: 'Filter by warehouse Id' })
    @IsOptional()
    @IsString()
    warehouseId: string;

    @ApiPropertyOptional({
        description: 'Filter by Role',
        enum: Role,
        enumName: 'Role',
    })
    @IsOptional()
    @IsEnum(Role)
    role: Role;

    @ApiPropertyOptional({
        description: 'Active status (true/false)',
        example: false,
    })
    @IsOptional()
    @Transform(({ value }) => value == 'true')
    @IsBoolean()
    active?: boolean;
}
