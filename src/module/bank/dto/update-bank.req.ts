import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBankDto {
  @ApiPropertyOptional({ example: 'Vietcombank', description: 'Bank name' })
  @IsString()
  @IsOptional()
  inv_buyerBankName?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the bank is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
