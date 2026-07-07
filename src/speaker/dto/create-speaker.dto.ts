import {
    IsNotEmpty,
    IsString,
    MaxLength,
    IsOptional,
    IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeakerDto {
    @ApiProperty({ description: 'Speaker name (without title)', maxLength: 150 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(150)
    name: string;

    @ApiPropertyOptional({
        description: 'Honorific prefix, e.g. "Ustadz", "Dr.", "Syaikh"',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    honorific?: string;

    @ApiPropertyOptional({
        description: 'Academic credentials, e.g. "B.A., M.Pd."',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    credentials?: string;

    @ApiPropertyOptional({
        description: 'Suffix / doa, e.g. "حفظه الله"',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    suffix?: string;

    @ApiPropertyOptional({ description: 'Short biography' })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({
        description: 'Link this speaker to an existing platform user',
    })
    @IsOptional()
    @IsUUID()
    userId?: string;
}
