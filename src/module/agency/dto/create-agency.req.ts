import {
  IsBoolean,
  IsEmail,
  IsMongoId,
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
  agencyName: string;

  @ApiProperty({
    description: 'Name of the agency',
    example: 'Best Travel Agency',
  })
  @IsString()
  @IsEmail()
  agencyEmail: string;

  @ApiProperty({
    description: 'Commission percentage for the agency',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  commissionPercent: number;

  @ApiProperty({
    example: '649a6f1e5f1234567890abcf',
    description: 'Employee ID',
  })
  @IsOptional()
  @IsString({ message: 'employeeId must be a string' })
  @IsMongoId({ message: 'employeeId must be a valid MongoDB ObjectId' })
  employeeId: string;

  @ApiProperty({
    description: 'Indicates if the agency is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
