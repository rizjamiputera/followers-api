import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReactionQueryDto {
    @ApiProperty({
        description: 'Reaction Type',
        enum: ReactionType,
        enumName: 'ReactionType'
    })
    @IsEnum(ReactionType)
    type?: ReactionType;
}
