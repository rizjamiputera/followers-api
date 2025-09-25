import { Module } from '@nestjs/common';
import { VisitStatsController } from './visit-stats.controller';
import { VisitStatsService } from './visit-stats.service';
import { PrismaService } from 'src/prisma.service';

@Module({
    controllers: [VisitStatsController],
    providers: [VisitStatsService, PrismaService],
    exports: [VisitStatsService],
})
export class VisitStatsModule {}