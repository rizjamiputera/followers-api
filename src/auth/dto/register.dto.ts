import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    Length,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty()
    @IsString()
    @Length(3, 100)
    name: string;

    @ApiProperty()
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
