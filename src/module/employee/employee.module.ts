import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '@schemas/employee.schema';
import { EmployeeController } from './employee.controller';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { LoggerService } from '@common/loggers/logger.service';
import { EmployeeRepository } from '@repositories/employee.repository';
import { EmployeeService } from './employee.service';
import { Counter, CounterSchema } from '@schemas/counter.schema';
import { DepartmentModule } from '@module/department/department.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    DepartmentModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, LoggerService, JwtAuthGuard],
  exports: [EmployeeService, EmployeeRepository, MongooseModule],
})
export class EmployeeModule {}
