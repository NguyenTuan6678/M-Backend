import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUsersDTO {
  @ApiProperty({ example: 'username', description: 'username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password', description: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'role', description: 'role' })
  @IsString()
  @IsNotEmpty()
  role: 'ADMIN' | 'USER';
}
