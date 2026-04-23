import { Module } from '@nestjs/common';
import { InformationsService } from './informations.service';
import { InformationsController } from './informations.controller';

@Module({
  providers: [InformationsService],
  controllers: [InformationsController]
})
export class InformationsModule {}
