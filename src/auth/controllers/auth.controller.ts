import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from '@auth/services/auth.service';
import { CreateUsersDTO } from '@users/dto/create-users.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('register')
  // @HttpCode(HttpStatus.CREATED)
  // async register(@Body(ValidationPipe) createUsersDTO: CreateUsersDTO) {
  //   return this.authService.register(createUsersDTO);
  // }

  // @Post('login')
  // @HttpCode(HttpStatus.OK)
  // async login(@Body() body: { username: string; password: string }) {
  //   const { username, password } = body;
  //   return this.authService.login(username, password);
  // }
}
