import { Module } from '@nestjs/common';
import { ContentTagService } from './content-tag.service';
import { ContentTagController } from './content-tag.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ContentTagController],
  providers: [ContentTagService, PrismaService],
  exports: [ContentTagService],
})
export class ContentTagModule {}