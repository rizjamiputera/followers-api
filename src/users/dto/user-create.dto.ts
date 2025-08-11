import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsStrongPassword,
    Length,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    warehouseId: string;

    @ApiProperty({ description: 'User name', maxLength: 100 })
    @IsString()
    @Length(1, 100)
    name: string;

    @ApiProperty({ description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @IsStrongPassword()
    @Length(6, 100)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Length(6, 100)
    confirm_password: string;
}
