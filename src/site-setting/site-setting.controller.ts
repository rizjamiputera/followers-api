import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SiteSettingService } from './site-setting.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { Public } from '../auth/auth.metadata';
import { Roles } from '../auth/guards/roles/roles.decorator';

@ApiTags('site-settings')
@Controller({ path: 'site-settings', version: '1' })
export class SiteSettingController {
    constructor(private readonly service: SiteSettingService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get site-wide settings (public)' })
    get() {
        return this.service.get();
    }

    @Put()
    @ApiBearerAuth()
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Update site settings (admin only)' })
    update(@Body() dto: UpdateSiteSettingDto) {
        return this.service.update(dto);
    }

    @Post('og-image')
    @ApiBearerAuth()
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image'))
    @ApiOperation({ summary: 'Upload social share (OG) image (admin only)' })
    uploadOgImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10000 * 1000 }),
                    new FileTypeValidator({ fileType: 'image/jpeg|jpg|png' }),
                ],
            }),
        )
        image: Express.Multer.File,
    ) {
        return this.service.updateOgImage(image);
    }
}
