import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DogsModule } from '@/modules/domain/dogs/dogs.module';

@Module({
  imports: [DogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
