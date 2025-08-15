import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterCommentQueryDto {
    @ApiPropertyOptional({ description: 'Filter by article Id' })
    @IsOptional()
    @IsString()
    articleId: string;

    @ApiPropertyOptional({ description: 'Filter by parent Id' })
    @IsOptional()
    @IsString()
    parentId: string;
}
