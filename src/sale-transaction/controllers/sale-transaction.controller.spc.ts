import { Test, TestingModule } from '@nestjs/testing';
import { SaleTransactionController } from './sale-transaction.controller';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('SaleTransactionController', () => {
  let controller: SaleTransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleTransactionController],
    }).compile();

    controller = module.get<SaleTransactionController>(
      SaleTransactionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
