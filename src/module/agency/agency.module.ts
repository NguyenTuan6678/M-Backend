import { Module } from '@nestjs/common';
import { Agency, AgencySchema } from '../../schemas/agency.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { AgencyRepository } from '@repositories/agency.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';
import { Employee, EmployeeSchema } from '@schemas/employee.schema';
import { Counter, CounterSchema } from '@schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Agency.name, schema: AgencySchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [AgencyController],
  providers: [AgencyService, AgencyRepository, LoggerService, JwtAuthGuard],
  exports: [AgencyService, AgencyRepository, MongooseModule],
})
export class AgencyModule {}
