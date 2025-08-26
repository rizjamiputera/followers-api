import { Module } from '@nestjs/common';
import { ContentStatsService } from './content-stats.service';
import { ContentStatsController } from './content-stats.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
    controllers: [ContentStatsController],
    providers: [ContentStatsService, PrismaService],
})
export class ContentStatsModule {}
