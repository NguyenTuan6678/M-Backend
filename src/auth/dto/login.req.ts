import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginReqType {
  @ApiProperty({ example: 'example', description: 'username', type: String })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'example', description: 'password', type: String })
  @IsString()
  @IsNotEmpty()
  password: string;
}
