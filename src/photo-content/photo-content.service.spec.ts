import { Test, TestingModule } from '@nestjs/testing';
import { PhotoContentService } from './photo-content.service';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';

describe('PhotoContentService', () => {
    let service: PhotoContentService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PhotoContentService,
                { provide: PrismaService, useValue: {} },
                { provide: AppService, useValue: {} },
            ],
        }).compile();

        service = module.get<PhotoContentService>(PhotoContentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
