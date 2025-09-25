import { Module } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { CreatorController } from './creator.controller';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma.service';

@Module({
    controllers: [CreatorController],
    providers: [CreatorService, AppService, PrismaService],
})
export class CreatorModule { }
