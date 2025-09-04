import { Test, TestingModule } from '@nestjs/testing';
import { HomePageController } from './home-page.controller';
import { HomePageService } from './home-page.service';

describe('HomePageController', () => {
  let controller: HomePageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomePageController],
      providers: [HomePageService],
    }).compile();

    controller = module.get<HomePageController>(HomePageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
