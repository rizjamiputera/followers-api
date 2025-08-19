import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '@prisma/client';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateArticleDto {
    @ApiProperty({ description: 'Article title' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ description: 'Article excerpt' })
    @IsNotEmpty()
    @IsString()
    excerpt: string;

    @ApiProperty({ description: 'Article slug' })
    @IsNotEmpty()
    @IsString()
    slug: string;

    @ApiProperty({ description: 'Article content (JSON)' })
    @IsNotEmpty()
    content: any;

    @ApiPropertyOptional({ description: 'Is featured article' })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        description: 'Article status',
        enum: ArticleStatus,
        enumName: 'ArticleStatus',
    })
    @IsOptional()
    @IsEnum(ArticleStatus)
    status?: ArticleStatus;

    @ApiPropertyOptional({
        description: 'Array of tag names to associate with the article',
        type: [String],
        example: ['Technology', 'Programming', 'Web Development'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}
