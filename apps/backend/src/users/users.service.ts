import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const testUser = await this.usersRepository.findOneBy({ username: 'testuser' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('Test@1234', 10);
      await this.usersRepository.save({
        username: 'testuser',
        password: hashedPassword,
      });
      console.log('Test user created: testuser / Test@1234');
    }
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ username });
  }

  async findOneById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ id });
  }

  async updateRefreshToken(userId: number, refreshToken: string | null) {
    await this.usersRepository.update(userId, { refreshToken });
  }
}
