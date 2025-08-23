import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PublishEventDto {
    @ApiProperty({ description: 'Publish date' })
    @IsDateString()
    @IsOptional()
    publishedAt?: string;
}
