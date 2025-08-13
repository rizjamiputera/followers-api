import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    Length,
} from 'class-validator';

export class ChangeUserPasswordDto {
    @ApiProperty()
    @IsString()
    @IsStrongPassword()
    @Length(6, 100)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    confirm_password: string;
}
