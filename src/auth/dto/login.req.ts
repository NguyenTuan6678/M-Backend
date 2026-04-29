import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginReqType {
  @ApiProperty({ example: 'example', description: 'username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'example', description: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
