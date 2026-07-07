import { Test, TestingModule } from '@nestjs/testing';
import { ContentStatsService } from './content-stats.service';
import { PrismaService } from '../prisma.service';

describe('ContentStatsService', () => {
    let service: ContentStatsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContentStatsService,
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        service = module.get<ContentStatsService>(ContentStatsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
