import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class PublishArticleDto {
    @ApiProperty({ description: 'Publish date' })
    @IsDateString()
    publishedAt?: string;
}
