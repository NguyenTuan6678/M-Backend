import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterAccountDto {
  @ApiProperty({ example: 'admin', description: 'username', type: 'string' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'admin', description: 'password', type: 'string' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
