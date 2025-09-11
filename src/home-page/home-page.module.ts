import { Module } from '@nestjs/common';
import { HomePageService } from './home-page.service';
import { HomePageController } from './home-page.controller';
import { ArticleModule } from '../article/article.module';
import { EventModule } from '../event/event.module';

@Module({
    imports: [ArticleModule, EventModule],
    controllers: [HomePageController],
    providers: [HomePageService],
    exports: [HomePageService],
})
export class HomePageModule {}
