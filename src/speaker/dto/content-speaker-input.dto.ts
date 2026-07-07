import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * One pemateri attached to an article/event. Either reference an existing
 * speaker via `speakerId`, or provide `name` (+ optional titles) to create a
 * new speaker on the fly from the editor.
 */
export class ContentSpeakerInputDto {
    @ApiPropertyOptional({
        description:
            'Existing speaker id. Omit to create a new speaker from the fields below.',
    })
    @IsOptional()
    @IsUUID()
    speakerId?: string;

    @ApiPropertyOptional({
        description: 'Name for a new speaker (required when speakerId is omitted)',
        maxLength: 150,
    })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name?: string;

    @ApiPropertyOptional({ description: 'e.g. "Ustadz", "Dr."', maxLength: 50 })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    honorific?: string;

    @ApiPropertyOptional({ description: 'e.g. "B.A., M.Pd."', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    credentials?: string;

    @ApiPropertyOptional({ description: 'e.g. "حفظه الله"', maxLength: 50 })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    suffix?: string;

    @ApiPropertyOptional({
        description: 'Role in this content, e.g. "pemateri utama", "moderator"',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    role?: string;
}
