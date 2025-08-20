import { Test, TestingModule } from '@nestjs/testing';
import { PhotoContentService } from './photo-content.service';

describe('PhotoContentService', () => {
  let service: PhotoContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhotoContentService],
    }).compile();

    service = module.get<PhotoContentService>(PhotoContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
