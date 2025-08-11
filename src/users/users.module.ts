import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, PrismaService, AuthService, AppService],
})
export class UsersModule {}
