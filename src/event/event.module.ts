import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [MailModule],
    controllers: [EventController],
    providers: [EventService, AppService, PrismaService],
    exports: [EventService],
})
export class EventModule {}
