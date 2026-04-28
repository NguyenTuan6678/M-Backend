import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../module/users/users.service';
import { CreateUsersDTO } from '../module/users/dto/create-users.dto';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}
  async register(createUsersDto: CreateUsersDTO) {
    return this.usersService.createUser(createUsersDto);
  }
  async login(username: string, password: string) {
    const user = await this.usersService.validateUser(username, password);
    if (!user) {
      throw new BadRequestException('username hoặc password không đúng');
    }
    const payload = {
      sub: user._id.toString(),
      username: user.username,
    };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('app.jwt.expiresIn'),
      }),
      user,
    };
  }
}
