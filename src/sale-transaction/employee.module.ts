import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from './schemas/employee.schema';
import { EmployeeController } from './controllers/employee.controller';
import { JwtAuthGuard } from '@auth/guards/auth.guard';
import { LoggerService } from '@common/logs/logger.service';
import { EmployeeRepository } from './repositories/employee.repository';
import { EmployeeService } from './services/employee.service';

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
