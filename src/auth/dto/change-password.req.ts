import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'admin',
    description: 'old password',
    type: 'string',
  })
  old_password: string;

  @ApiProperty({
    example: 'admin',
    description: 'new password',
    type: 'string',
  })
  new_password: string;
}
