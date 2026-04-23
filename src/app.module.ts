import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './module/users/users.module';
import { DocumentsController } from './module/documents/documents.controller';
import { DocumentsService } from './module/documents/documents.service';
import { DocumentsModule } from './module/documents/documents.module';
import { InformationModule } from './module/information/information.module';

@Module({
  imports: [UsersModule, DocumentsModule, InformationModule],
  controllers: [AppController, DocumentsController],
  providers: [AppService, DocumentsService],
})
export class AppModule {}
