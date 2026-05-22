import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlertService } from './alert.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
