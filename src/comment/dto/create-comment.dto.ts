import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDto {
    @ApiProperty({ description: 'Article Id' })
    @IsNotEmpty()
    @IsString()
    articleId: string;

    @ApiProperty({ description: 'Parent comment Id' })
    @IsOptional()
    @IsString()
    parentId: string;

    @ApiProperty({ description: 'Comment' })
    @IsNotEmpty()
    @IsString()
    content: string;
}
