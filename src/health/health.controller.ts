import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get('/live')
  checkLive() {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }

  @Get('/ready')
  @HealthCheck()
  checkDb() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }

  @Get('/memory')
  @HealthCheck()
  checkMM() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
