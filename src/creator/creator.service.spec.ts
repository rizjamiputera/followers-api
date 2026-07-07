import { Test, TestingModule } from '@nestjs/testing';
import { CreatorService } from './creator.service';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';

describe('CreatorService', () => {
    let service: CreatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreatorService,
                { provide: PrismaService, useValue: {} },
                { provide: AppService, useValue: {} },
            ],
        }).compile();

        service = module.get<CreatorService>(CreatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
