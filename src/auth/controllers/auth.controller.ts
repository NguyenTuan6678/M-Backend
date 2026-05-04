import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '@auth/services/auth.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterAccountDto } from '@auth/dto/register.req';
import { LoginReqType } from '@auth/dto/login.req';
import { RefreshTokenDto } from '@auth/dto/refresh-token.req';
import { JwtAuthGuard } from '@auth/guards/auth.guard';
import { MessageResponse } from '@app-types/message.res';
import { LoginRes } from '@auth/dto/login.res';
import { ChangePasswordDto } from '@auth/dto/change-password.req';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'register for admin account' })
  @ApiResponse({
    status: 200,
    description: 'Register successfully',
    type: MessageResponse,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({ type: RegisterAccountDto, description: 'Register request' })
  register(@Body() registerAccountDto: RegisterAccountDto) {
    return this.authService.register(registerAccountDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'login for admin account' })
  @ApiResponse({
    status: 200,
    description: 'Login successfully',
    type: LoginRes,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({ type: LoginReqType, description: 'Login request' })
  login(@Body() loginDto: LoginReqType) {
    return this.authService.login(loginDto);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'refresh token for admin account' })
  @ApiResponse({
    status: 200,
    description: 'Login successfully',
    type: LoginRes,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({ type: RefreshTokenDto, description: 'refresh token request' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'change password for admin account' })
  @ApiBearerAuth('authorization')
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: MessageResponse,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({ type: ChangePasswordDto, description: 'Change password request' })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const userId = (request as any).user;
    return this.authService.changePassword(changePasswordDto, userId);
  }
}
