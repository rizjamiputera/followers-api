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
}
