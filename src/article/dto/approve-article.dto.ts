import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class ApproveArticleDto {
    @ApiProperty({ description: 'Publish date' })
    @IsOptional()
    @IsDateString()
    publishedAt?: string;
}
