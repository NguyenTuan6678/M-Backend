import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'admin', description: 'old password' })
  old_password: string;

  @ApiProperty({ example: 'admin', description: 'new password' })
  new_password: string;
}
