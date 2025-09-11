import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from './user.service';
import { MailService } from 'src/mail/mail.service';

@Module({
    controllers: [UserController],
    providers: [
        UserService,
        PrismaService,
        AuthService,
        AppService,
        MailService,
    ],
})
export class UserModule {}
