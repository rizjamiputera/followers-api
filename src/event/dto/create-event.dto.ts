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

export class CreateEventDto {
    @ApiProperty({ description: 'Event title' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ description: 'Event excerpt' })
    @IsNotEmpty()
    @IsString()
    excerpt: string;

    @ApiProperty({ description: 'Event slug' })
    @IsNotEmpty()
    @IsString()
    slug: string;

    @ApiProperty({ description: 'Event star at' })
    @IsNotEmpty()
    @IsString()
    start_at: string;

    @ApiProperty({ description: 'Location' })
    @IsOptional()
    @IsString()
    location: string;

    @ApiProperty({ description: 'Address' })
    @IsOptional()
    @IsString()
    address: string;

    @ApiProperty({ description: 'Image' })
    @IsOptional()
    @IsString()
    image: string;

    @ApiProperty({ description: 'Image medium' })
    @IsOptional()
    @IsString()
    image_md: string;

    @ApiProperty({ description: 'Image Portrait' })
    @IsOptional()
    @IsString()
    image_portrait: string;

    @ApiProperty({ description: 'Image Portrait medium' })
    @IsOptional()
    @IsString()
    image_portrait_md: string;

    @ApiProperty({ description: 'Event content (JSON)' })
    @IsNotEmpty()
    content: any;

    @ApiPropertyOptional({ description: 'Is featured event' })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        description: 'Array of tag names to associate with the event',
        type: [String],
        example: ['Technology', 'Programming', 'Web Development'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({
        description:
            'Pemateri (speakers) for this event. Each item references an existing speakerId or provides a name to create one.',
        type: [ContentSpeakerInputDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ContentSpeakerInputDto)
    speakers?: ContentSpeakerInputDto[];

    @ApiPropertyOptional({
        description: 'Category id (UUID). If omitted the event is uncategorized.',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;
}
