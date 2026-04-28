import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './module/users/users.module';
import { DocumentsController } from './module/documents/documents.controller';
import { DocumentsService } from './module/documents/documents.service';
import { DocumentsModule } from './module/documents/documents.module';
import { InformationModule } from './module/information/information.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongodb.uri'),
        retryAttempts: 5,
        retryDelay: 1000,
      }),
    }),
    UsersModule,
    DocumentsModule,
    InformationModule,
    AuthModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class AppModule {}
