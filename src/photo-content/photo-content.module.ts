import { Module } from '@nestjs/common';
import { PhotoContentService } from './photo-content.service';
import { PhotoContentController } from './photo-content.controller';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma.service';

@Module({
    controllers: [PhotoContentController],
    providers: [PhotoContentService, AppService, PrismaService],
})
export class PhotoContentModule { }
