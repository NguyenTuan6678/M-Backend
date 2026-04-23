import { Test, TestingModule } from '@nestjs/testing';
import { InformationsController } from './informations.controller';

describe('InformationsController', () => {
  let controller: InformationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InformationsController],
    }).compile();

    controller = module.get<InformationsController>(InformationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
