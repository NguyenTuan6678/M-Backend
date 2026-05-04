import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { SaleTransactionService } from './sale-transaction.service';

describe('SaleTransactionService', () => {
  let service: SaleTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleTransactionService],
    }).compile();

    service = module.get<SaleTransactionService>(SaleTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
