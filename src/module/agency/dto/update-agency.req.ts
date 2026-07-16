import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAgencyDto {
  @ApiPropertyOptional({
    description: 'Name of the agency',
    example: 'Best Travel Agency',
  })
  @IsString()
  @IsOptional()
  inv_agencyName?: string;

  @ApiPropertyOptional({
    description: 'Name of the agency',
    example: 'Best Travel Agency',
  })
  @IsString()
  @IsOptional()
  agencyName?: string;

  @ApiPropertyOptional({
    description: 'Name of the agency',
    example: 'Best Travel Agency',
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  agencyEmail?: string;

  @ApiPropertyOptional({
    description: 'Commission percentage for the agency',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  commissionPercent?: number;

  @ApiPropertyOptional({
    example: '649a6f1e5f1234567890abcf',
    description: 'Employee ID',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return value;
  })
  @IsMongoId({ message: 'employeeId must be a valid MongoDB ObjectId' })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the agency is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
