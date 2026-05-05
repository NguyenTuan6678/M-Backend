import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '@schemas/employee.schema';
import { EmployeeController } from '@employee/employee.controller';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { LoggerService } from '@common/logs/logger.service';
import { EmployeeRepository } from '@repositories/employee.repository';
import { EmployeeService } from '@employee/employee.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, LoggerService, JwtAuthGuard],
  exports: [EmployeeService, EmployeeRepository, MongooseModule],
})
export class EmployeeModule {}
