import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class IncludesQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return []; // Ensure undefined or empty input results in an empty array
        return Array.isArray(value)
            ? value
            : value.split(',').map((v: string) => v.trim()); // Support both array and string input
    })
    @IsArray()
    @IsString({ each: true }) // Ensures all items in the array are strings
    includes: string[];
}
