import { Test, TestingModule } from '@nestjs/testing';
import { ContentStatsController } from './content-stats.controller';
import { ContentStatsService } from './content-stats.service';

describe('ContentStatsController', () => {
  let controller: ContentStatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentStatsController],
      providers: [ContentStatsService],
    }).compile();

    controller = module.get<ContentStatsController>(ContentStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
