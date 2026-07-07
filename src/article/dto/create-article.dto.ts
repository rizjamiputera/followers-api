import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { ContentSpeakerInputDto } from 'src/speaker/dto/content-speaker-input.dto';

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

    @ApiProperty({ description: 'Image' })
    @IsOptional()
    @IsString()
    image: string;

    @ApiProperty({ description: 'Image medium' })
    @IsOptional()
    @IsString()
    image_md: string;

    @ApiProperty({ description: 'Article content (JSON)' })
    @IsNotEmpty()
    content: any;

    @ApiPropertyOptional({ description: 'Is featured article' })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    // @ApiPropertyOptional({
    //     description: 'Article status',
    //     enum: ArticleStatus,
    //     enumName: 'ArticleStatus',
    // })
    // @IsOptional()
    // @IsEnum(ArticleStatus)
    // status?: ArticleStatus;

    @ApiPropertyOptional({
        description: 'Array of tag names to associate with the article',
        type: [String],
        example: ['Technology', 'Programming', 'Web Development'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({
        description:
            'Pemateri (speakers) for this article. Each item references an existing speakerId or provides a name to create one.',
        type: [ContentSpeakerInputDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ContentSpeakerInputDto)
    speakers?: ContentSpeakerInputDto[];

    @ApiPropertyOptional({
        description: 'Category id (UUID). If omitted the article is uncategorized.',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;
}
