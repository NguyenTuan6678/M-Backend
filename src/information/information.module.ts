import { Module } from '@nestjs/common';
import { InformationService } from '@information/services/information.service';
import { InformationController } from '@information/controllers/information.controller';

@Module({
  providers: [InformationService],
  controllers: [InformationController],
})
export class InformationModule {}
