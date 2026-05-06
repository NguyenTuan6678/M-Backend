import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgencyDto {
  @ApiProperty({
    description: 'Name of the agency',
    example: 'Best Travel Agency',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Commission percentage for the agency',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  commissionPercent: number;

  @ApiProperty({
    description: 'Indicates if the agency is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
