import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Min,
} from 'class-validator';

export class PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Search keyword' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page. 0 to get all data',
        example: 10,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(0)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order (asc/desc)',
        example: 'desc',
    })
    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc' = 'desc';

    @ApiPropertyOptional({
        description: 'Start date in YYYY-MM-DD format',
        type: 'string',
        format: 'date',
    })
    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
        message: 'Start date must be in YYYY-MM-DD format.',
    })
    @IsOptional()
    start_date: string;

    @ApiPropertyOptional({
        description: 'End date in YYYY-MM-DD format',
        type: 'string',
        format: 'date',
    })
    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
        message: 'End date must be in YYYY-MM-DD format.',
    })
    @IsOptional()
    end_date: string;
}

export class PaginationDeletedQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Deleted status (true/false)',
        example: false,
    })
    @IsOptional()
    @Transform(({ value }) => value == 'true')
    @IsBoolean()
    deleted?: boolean = false;
}

export class PaginationIncludeQueryDto extends PaginationQueryDto {
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
    includes: string[] = [];
}

export class PaginationDeletedIncludeQueryDto extends PaginationDeletedQueryDto {
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
    includes: string[] = [];
}
