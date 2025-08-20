import { Injectable } from '@nestjs/common';
import { CreatePhotoContentDto } from './dto/create-photo-content.dto';
import { UpdatePhotoContentDto } from './dto/update-photo-content.dto';
import { PhotoContent, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';

const transformImages = ['path'];

@Injectable()
export class PhotoContentService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    async create(data: Prisma.PhotoContentCreateInput): Promise<PhotoContent> {
        const photo = await this.prisma.photoContent.create({
            data
        });

        return this.app.transformImageUrls(photo, ...transformImages)
    }

    async createMany(paths: string[]): Promise<PhotoContent[]> {
        // });
        const photos = await Promise.all(
            paths.map(path =>
                this.prisma.photoContent.create({
                    data: { path }
                }),
            ),
        );


        return photos.map(photo => this.app.transformImageUrls(photo, ...transformImages));
    }

    // findAll() {
    //     return `This action returns all photoContent`;
    // }

    // findOne(id: number) {
    //     return `This action returns a #${id} photoContent`;
    // }

    // update(id: number, updatePhotoContentDto: UpdatePhotoContentDto) {
    //     return `This action updates a #${id} photoContent`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} photoContent`;
    // }
}
