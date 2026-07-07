import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
} from 'class-validator';

export class FilterArticleQueryDto {
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

    @ApiPropertyOptional({ description: 'Filter by category id (UUID)' })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Filter by category slug' })
    @IsOptional()
    @IsString()
    categorySlug?: string;

    @ApiPropertyOptional({ description: 'Filter by pemateri (speaker) slug' })
    @IsOptional()
    @IsString()
    speakerSlug?: string;
}
