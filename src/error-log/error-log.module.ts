import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ErrorLogController } from './error-log.controller';
import { ErrorLogService } from './error-log.service';

@Module({
    controllers: [ErrorLogController],
    providers: [ErrorLogService, PrismaService],
})
export class ErrorLogsModule {}
