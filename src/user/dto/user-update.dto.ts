import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ description: 'User name', maxLength: 100 })
    @Length(1, 100)
    @IsOptional()
    @IsString()
    name: string;

    @ApiProperty()
    @IsOptional()
    @IsEnum(Role)
    role: Role;
}
