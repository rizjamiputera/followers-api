import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaService } from 'src/prisma.service';
import { AppService } from 'src/app.service';

@Module({
    controllers: [ArticleController],
    providers: [ArticleService, PrismaService, AppService],
})
export class ArticleModule {}
