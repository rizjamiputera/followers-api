import { IsNotEmpty, IsString, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
    @ApiProperty({ description: 'Tag name', maxLength: 100 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    // @ApiProperty({
    //     description: 'Tag color in HEX format',
    //     example: '#FF5733',
    //     required: false,
    //     maxLength: 7
    // })
    // @IsOptional()
    // @IsString()
    // @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    //     message: 'Color must be a valid HEX color code (e.g., #FF5733 or #FFF)'
    // })
    // color?: string;
}
