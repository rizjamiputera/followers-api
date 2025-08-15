import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class PublishArticleDto {
    @ApiProperty({ description: 'Publish date' })
    @IsDateString()
    publishedAt?: string;
}
