import { JwtAuthGuard } from './auth.guard';
import { describe, it, expect } from '@jest/globals';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });
});
