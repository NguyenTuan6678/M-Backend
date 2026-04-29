import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@users/services/users.service';
import { CreateUsersDTO } from '@users/dto/create-users.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'users/schemas/users.schema';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel('users') private userModal: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async generateToken(userInfo: User) {
    const payload = {
      id: userInfo.id,
      username: userInfo.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '12h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '24h',
    });

    const accessTokenExpiresIn = new Date();
    accessTokenExpiresIn.setMinutes(accessTokenExpiresIn.getMinutes() + 15);

    const refreshTokenExpiresIn = new Date();
    refreshTokenExpiresIn.setDate(refreshTokenExpiresIn.getDate() + 7);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: accessTokenExpiresIn.getTime(),
      refreshTokenExpiresIn: refreshTokenExpiresIn.getTime(),
    };
  }

  // async register(createUsersDto: CreateUsersDTO) {
  //   return this.usersService.create(createUsersDto);
  // }
  // async login(username: string, password: string) {
  //   const user = await this.usersService.validateUser(username, password);
  //   if (!user) {
  //     throw new BadRequestException('username/password not correct');
  //   }
  //   const payload = {
  //     sub: user._id.toString(),
  //     username: user.username,
  //   };
  //   return {
  //     accessToken: this.jwtService.sign(payload, {
  //       expiresIn: this.configService.get('app.jwt.expiresIn'),
  //     }),
  //     user,
  //   };
}
