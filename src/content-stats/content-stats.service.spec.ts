import { Test, TestingModule } from '@nestjs/testing';
import { ContentStatsService } from './content-stats.service';

describe('ContentStatsService', () => {
  let service: ContentStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentStatsService],
    }).compile();

    service = module.get<ContentStatsService>(ContentStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
