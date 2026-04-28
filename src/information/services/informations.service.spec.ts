import { Test, TestingModule } from '@nestjs/testing';
import { InformationService } from '@information/services/information.service';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('InformationService', () => {
  let service: InformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InformationService],
    }).compile();

    service = module.get<InformationService>(InformationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
