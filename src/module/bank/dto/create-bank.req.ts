import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankDto {
  @ApiProperty({ example: 'Vietcombank', description: 'Bank name' })
  @IsString()
  @IsNotEmpty()
  inv_buyerBankName: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the bank is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
