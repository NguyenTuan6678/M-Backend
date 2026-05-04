import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@users/services/users.service';
import { JwtPayload } from '@auth/interface/auth.payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'fallback_secret',
    });
  }

  // ✅ Uncomment and fix validate()
  async validate(payload: JwtPayload) {
    const user = await this.usersService.getUserById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // This gets attached to request.user
    return { id: payload.id, username: payload.username };
  }
}
