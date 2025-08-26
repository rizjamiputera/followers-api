import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsOptional,
    IsString,
} from 'class-validator';

export class FilterEventQueryDto {
    @ApiPropertyOptional({ description: 'Filter by author Id' })
    @IsOptional()
    @IsString()
    authorId: string;

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
    tags: string[];

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: ContentStatus,
        enumName: 'ContentStatus',
    })
    @IsOptional()
    @IsEnum(ContentStatus)
    status: ContentStatus;

    @ApiPropertyOptional({
        description: 'Exclude some statuses',
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return []; // Ensure undefined or empty input results in an empty array
        return Array.isArray(value)
            ? value
            : value.split(',').map((v: string) => v.trim()); // Support both array and string input
    })
    @IsArray()
    @IsString({ each: true }) // Ensures all items in the array are strings
    exclude_statuses: string[] = [];

    @ApiPropertyOptional({ description: 'Filter with has claim data' })
    @IsOptional()
    @Transform(({ value }) => value == 'true')
    @IsBoolean()
    published?: boolean;

    @ApiPropertyOptional({ description: 'Filter with start from' })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined; // Ensure undefined or empty input results in an empty array
        return new Date(value);
    })
    @IsDate()
    start_from?: Date;
}
