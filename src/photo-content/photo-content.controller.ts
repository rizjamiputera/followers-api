import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { PhotoContentService } from './photo-content.service';
import { CreatePhotoContentDto } from './dto/create-photo-content.dto';
import { UpdatePhotoContentDto } from './dto/update-photo-content.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoContent, Prisma } from '@prisma/client';
import { AppService } from 'src/app.service';

@ApiBearerAuth()
@ApiTags('Photo Content')
@Controller({
    path: 'photo-content',
    version: '1',
})
export class PhotoContentController {
    constructor(
        private readonly photoContentService: PhotoContentService,
        private readonly appService: AppService,
    ) { }

    @Post()
    @UseInterceptors(FileInterceptor('photo'))
    async create(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    // max 10 MB
                    new MaxFileSizeValidator({ maxSize: 10000 * 1000 }),
                    new FileTypeValidator({
                        fileType: 'image/jpeg|jpg|png',
                    }),
                ],
            }),
        )
        photo: Express.Multer.File,
    ): Promise<PhotoContent> {
        const path = await this.appService.save_image(
            photo,
            '/photo',
            800
        );

        const data: Prisma.PhotoContentCreateInput = {
            path
        };

        return this.photoContentService.create(data);
    }

    // @Get()
    // findAll() {
    //     return this.photoContentService.findAll();
    // }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.photoContentService.findOne(+id);
    // }

    // @Patch(':id')
    // update(@Param('id') id: string, @Body() updatePhotoContentDto: UpdatePhotoContentDto) {
    //     return this.photoContentService.update(+id, updatePhotoContentDto);
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.photoContentService.remove(+id);
    // }
}
