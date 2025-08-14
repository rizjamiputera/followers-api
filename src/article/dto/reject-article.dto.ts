import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectArticleDto {
    @ApiProperty({ description: 'Approval Note' })
    @IsOptional()
    @IsString()
    note: string;
}
