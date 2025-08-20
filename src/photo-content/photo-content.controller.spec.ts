import { Test, TestingModule } from '@nestjs/testing';
import { PhotoContentController } from './photo-content.controller';
import { PhotoContentService } from './photo-content.service';

describe('PhotoContentController', () => {
  let controller: PhotoContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotoContentController],
      providers: [PhotoContentService],
    }).compile();

    controller = module.get<PhotoContentController>(PhotoContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
