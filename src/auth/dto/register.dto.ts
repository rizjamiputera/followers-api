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
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 0,
        minSymbols: 0,
    }, { message: 'Password terlalu lemah' })
    @Length(6, 100)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Length(6, 100)
    confirm_password: string;
}
