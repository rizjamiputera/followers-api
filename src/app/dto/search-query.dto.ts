import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchQueryDto {
    @ApiPropertyOptional({ description: 'Search keyword' })
    @IsOptional()
    @IsString()
    search?: string;
}
