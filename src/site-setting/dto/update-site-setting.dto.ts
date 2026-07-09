import {
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SiteSocialDto {
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) instagram?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) youtube?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) tiktok?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) facebook?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) x?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) whatsapp?: string;
}

export class SiteContactDto {
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) email?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) phone?: string;
}

export class UpdateSiteSettingDto {
    @ApiPropertyOptional({ maxLength: 60 })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    site_title?: string;

    @ApiPropertyOptional({ maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    meta_description?: string;

    @ApiPropertyOptional({ maxLength: 80 })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    tagline?: string;

    @ApiPropertyOptional({ type: SiteSocialDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SiteSocialDto)
    social?: SiteSocialDto;

    @ApiPropertyOptional({ type: SiteContactDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SiteContactDto)
    contact?: SiteContactDto;
}
