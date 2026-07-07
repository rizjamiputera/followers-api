import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma.service';
import { MailModule } from 'src/mail/mail.module';
import { SpeakerModule } from 'src/speaker/speaker.module';

@Module({
    imports: [MailModule, SpeakerModule],
    controllers: [EventController],
    providers: [EventService, AppService, PrismaService],
    exports: [EventService],
})
export class EventModule {}
