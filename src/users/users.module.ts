import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from '@users/services/users.service';
import { UsersController } from '@users/controllers/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersRepository } from './repositories/users.repository';
import { LoggerService } from '@common/logs/logger.service';
import { User, UserSchema } from './schemas/users.schema';
import { JwtAuthGuard } from '@auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, LoggerService, JwtAuthGuard],
  exports: [
    UsersService,
    UsersRepository,
    MongooseModule, // ← Export so AuthModule can use the model
  ],
})
export class UsersModule {}
