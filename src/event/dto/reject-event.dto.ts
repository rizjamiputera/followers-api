import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectEventDto {
    @ApiProperty({ description: 'Approval Note' })
    @IsOptional()
    @IsString()
    note?: string;
}
