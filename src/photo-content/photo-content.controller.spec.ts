import { Test, TestingModule } from '@nestjs/testing';
import { PhotoContentController } from './photo-content.controller';
import { PhotoContentService } from './photo-content.service';
import { AppService } from '../app.service';

describe('PhotoContentController', () => {
    let controller: PhotoContentController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PhotoContentController],
            providers: [
                { provide: PhotoContentService, useValue: {} },
                { provide: AppService, useValue: {} },
            ],
        }).compile();

        controller = module.get<PhotoContentController>(PhotoContentController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
