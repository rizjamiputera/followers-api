import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

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
}
