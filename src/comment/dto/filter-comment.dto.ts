import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterCommentQueryDto {
    @ApiPropertyOptional({ description: 'Filter by content Id' })
    @IsOptional()
    @IsString()
    contentId: string;

    @ApiPropertyOptional({ description: 'Filter by parent Id' })
    @IsOptional()
    @IsString()
    parentId: string;
}
