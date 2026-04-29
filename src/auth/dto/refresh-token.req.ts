import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ name: 'refresh_token', description: 'refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
