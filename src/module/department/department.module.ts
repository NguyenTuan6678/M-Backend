import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from '@schemas/department.schema';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { DepartmentRepository } from '@repositories/department.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { Counter, CounterSchema } from '@schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [DepartmentController],
  providers: [
    DepartmentService,
    DepartmentRepository,
    LoggerService,
    JwtAuthGuard,
  ],
  exports: [DepartmentService, DepartmentRepository, MongooseModule],
})
export class DepartmentModule {}
