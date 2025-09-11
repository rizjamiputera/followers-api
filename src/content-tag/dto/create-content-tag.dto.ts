import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContentTagDto {
  @ApiProperty({ description: 'Article ID', required: false })
  @IsOptional()
  @IsUUID()
  articleId?: string;

  @ApiProperty({ description: 'Event ID', required: false })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiProperty({ description: 'Tag ID' })
  @IsNotEmpty()
  @IsUUID()
  tagId: string;
}