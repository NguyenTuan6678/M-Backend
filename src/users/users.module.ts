import { Module } from '@nestjs/common';
import { UsersService } from '@users/users.service';
import { UsersController } from '@users/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersRepository } from '@repositories/users.repository';
import { LoggerService } from '@common/logs/logger.service';
import { User, UserSchema } from '@schemas/users.schema';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, LoggerService, JwtAuthGuard],
  exports: [UsersService, UsersRepository, MongooseModule],
})
export class UsersModule {}
