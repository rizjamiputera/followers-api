import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SocialPlatform } from '@prisma/client';

class SocialLinkDto {
    @IsString()
    platform: SocialPlatform;

    @IsString()
    url: string;

    @IsOptional()
    @IsString()
    handle?: string;
}

export class UpdateCreatorDto {
    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specializations?: string[];

    @IsOptional()
    biography?: any;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SocialLinkDto)
    socialLinks?: SocialLinkDto[];
}
