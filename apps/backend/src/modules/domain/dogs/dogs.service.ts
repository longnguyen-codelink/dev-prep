import { Injectable } from '@nestjs/common';

@Injectable()
export class DogsService {
  findAll() {
    return 'This action returns all dogs';
  }
}
