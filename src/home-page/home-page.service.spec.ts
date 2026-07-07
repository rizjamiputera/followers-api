import { Test, TestingModule } from '@nestjs/testing';
import { HomePageService } from './home-page.service';
import { ArticleService } from '../article/article.service';
import { EventService } from '../event/event.service';

describe('HomePageService', () => {
    let service: HomePageService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HomePageService,
                { provide: ArticleService, useValue: {} },
                { provide: EventService, useValue: {} },
            ],
        }).compile();

        service = module.get<HomePageService>(HomePageService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
