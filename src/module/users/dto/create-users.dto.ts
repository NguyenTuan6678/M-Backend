import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUsersDTO {
  id: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(['ADMIN', 'USER'], { message: 'Valid role required' })
  @IsNotEmpty()
  role: 'ADMIN' | 'USER';
}
