import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FilterSpeakerDto {
    @ApiPropertyOptional({
        description: 'Only verified speakers',
    })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : value === 'true'))
    @IsBoolean()
    verified?: boolean;

    @ApiPropertyOptional({
        description:
            'Filter by whether the speaker has any published article/event. ' +
            'false = only speakers without published content (belum punya kajian publish).',
    })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : value === 'true'))
    @IsBoolean()
    hasPublished?: boolean;
}
