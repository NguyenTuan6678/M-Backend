import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'admin',
    description: 'old password',
    type: String,
  })
  old_password: string;

  @ApiProperty({
    example: 'admin',
    description: 'new password',
    type: String,
  })
  new_password: string;
}
