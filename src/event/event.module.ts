import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma.service';

@Module({
    controllers: [EventController],
    providers: [EventService, AppService, PrismaService],
})
export class EventModule {}
