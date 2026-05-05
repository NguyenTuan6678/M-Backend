import { Module } from '@nestjs/common';
import { Agency, AgencySchema } from '../schemas/agency.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { AgencyController } from '@agency/agency.controller';
import { AgencyService } from '@agency/agency.service';
import { AgencyRepository } from '@repositories/agency.repository';
import { LoggerService } from '@common/logs/logger.service';
import { JwtAuthGuard } from '@users/auth/guards/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }]),
  ],
  controllers: [AgencyController],
  providers: [AgencyService, AgencyRepository, LoggerService, JwtAuthGuard],
  exports: [AgencyService, AgencyRepository, MongooseModule],
})
export class AgencyModule {}
