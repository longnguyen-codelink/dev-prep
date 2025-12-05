import { Module } from '@nestjs/common';
import { Storage } from './storage';

@Module({
  providers: [Storage],
})
export class StorageModule {}
