import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsersModule } from '@users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../common/constants/jwt.const';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'users/schemas/users.schema';
import { JwtStrategy } from './strategies/auth.strategy';
import { JwtAuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
