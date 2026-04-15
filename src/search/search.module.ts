import { Module } from '@nestjs/common';
import { AppService } from '../app.service';
import { PrismaService } from '../prisma.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    controllers: [SearchController],
    providers: [SearchService, PrismaService, AppService],
})
export class SearchModule {}
