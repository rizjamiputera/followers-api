import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import { Module, Permission } from '@prisma/client';
import { SpeakerService } from './speaker.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { VerifySpeakerDto } from './dto/verify-speaker.dto';
import { FilterSpeakerDto } from './dto/filter-speaker.dto';
import { Public } from '../auth/auth.metadata';
import { PermissionsRequired } from '../auth/guards/permissions/permission.decorator';
import { PaginationQueryDto } from '../app/dto/pagination-query.dto';
import { AppService } from '../app.service';

@ApiTags('speakers')
@Controller({ path: 'speakers', version: '1' })
export class SpeakerController {
    constructor(
        private readonly speakerService: SpeakerService,
        private readonly appService: AppService,
    ) {}

    @Post()
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.CREATE)
    @ApiOperation({ summary: 'Create speaker (pemateri)' })
    @ApiResponse({ status: 201 })
    @ApiResponse({ status: 409, description: 'User already linked' })
    create(@Body() dto: CreateSpeakerDto) {
        return this.speakerService.create(dto);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'List speakers with published content counts' })
    findAll(
        @Query() pagination: PaginationQueryDto,
        @Query() filter: FilterSpeakerDto,
    ) {
        return this.speakerService.findAll(pagination, filter);
    }

    @Get('slug/:slug')
    @Public()
    @ApiOperation({ summary: 'Get speaker by slug with their published content' })
    findBySlug(@Param('slug') slug: string) {
        return this.speakerService.findBySlug(slug);
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get speaker by id' })
    findOne(@Param('id') id: string) {
        return this.speakerService.findOne(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.EDIT)
    @ApiOperation({ summary: 'Update speaker' })
    update(@Param('id') id: string, @Body() dto: UpdateSpeakerDto) {
        return this.speakerService.update(id, dto);
    }

    @Patch(':id/verify')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.PUBLISH)
    @ApiOperation({ summary: 'Set speaker verified status (admin)' })
    setVerified(@Param('id') id: string, @Body() dto: VerifySpeakerDto) {
        return this.speakerService.setVerified(id, dto.verified);
    }

    @Post(':id/avatar')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.EDIT)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('avatar'))
    @ApiOperation({ summary: 'Upload speaker avatar' })
    async uploadAvatar(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10000 * 1000 }),
                    new FileTypeValidator({ fileType: 'image/jpeg|jpg|png' }),
                ],
            }),
        )
        avatar: Express.Multer.File,
    ) {
        const { large, medium } = await this.appService.save_images(
            avatar,
            '/avatar',
        );
        return this.speakerService.updateAvatar(id, large, medium);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.DELETE)
    @ApiOperation({ summary: 'Delete speaker (soft delete)' })
    remove(@Param('id') id: string) {
        return this.speakerService.remove(id);
    }
}
