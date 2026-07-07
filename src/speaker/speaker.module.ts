import { Module } from '@nestjs/common';
import { SpeakerService } from './speaker.service';
import { SpeakerController } from './speaker.controller';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';

@Module({
    controllers: [SpeakerController],
    providers: [SpeakerService, PrismaService, AppService],
    exports: [SpeakerService],
})
export class SpeakerModule {}
