import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerService } from './common/logs/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new LoggerService();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allExceptionsFilter = new AllExceptionsFilter(logger);
  app.useGlobalFilters(allExceptionsFilter);

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? process.env.CORS_ORIGIN || '*'
        : 'your-domain.com',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('M-Invoice API')
    .setDescription('The M-Invoice API')
    .setVersion('1.0')
    .addTag('Catto')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Logging
  logger.log(`🚀 Server running on port ${port}`, 'Bootstrap');
  logger.log(`📍 MongoDB: ${process.env.MONGODB_URI}`, 'Bootstrap');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
