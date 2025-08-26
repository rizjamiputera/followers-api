import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';
import { UserService } from 'src/user/user.service';

@Module({
    controllers: [CommentController],
    providers: [CommentService, UserService, PrismaService, AppService],
})
export class CommentModule {}
