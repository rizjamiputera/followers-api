import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';
import { SpeakerService } from '../speaker/speaker.service';

describe('ArticleService', () => {
    let service: ArticleService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ArticleService,
                { provide: PrismaService, useValue: {} },
                { provide: AppService, useValue: {} },
                { provide: SpeakerService, useValue: {} },
            ],
        }).compile();

        service = module.get<ArticleService>(ArticleService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
