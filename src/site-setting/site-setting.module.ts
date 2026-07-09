import { Module } from '@nestjs/common';
import { SiteSettingService } from './site-setting.service';
import { SiteSettingController } from './site-setting.controller';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';

@Module({
    controllers: [SiteSettingController],
    providers: [SiteSettingService, PrismaService, AppService],
    exports: [SiteSettingService],
})
export class SiteSettingModule {}
