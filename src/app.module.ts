import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DocumentsController } from './documents/controllers/documents.controller';
import { DocumentsService } from './documents/services/documents.service';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaleTransactionModule } from './sale-transaction/sale-transaction.module';
import { TransactionItemModule } from './sale-transaction/transaction-item.module';

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
    SaleTransactionModule,
    AuthModule,
    TransactionItemModule,
  ],
  controllers: [AppController, DocumentsController],
  providers: [AppService, DocumentsService],
})
export class AppModule {}
