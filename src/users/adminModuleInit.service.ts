import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordCheakRole, User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}
  async onModuleInit() {
    await this.users.manager.transaction(async (manager) => {
      const exists = await manager.findOne(User, {
        where: { role: UserRole.SuperAdmin },
        lock: { mode: 'pessimistic_write' },
      });

      if (
        !exists &&
        process.env.SUPER_ADMIN_ID &&
        process.env.SUPER_ADMIN_PASSWORD
      ) {
        const admin = manager.create(User, {
          userId: process.env.SUPER_ADMIN_ID,
          password: process.env.SUPER_ADMIN_PASSWORD,
          userName: '관리자',
          nickname: '관리자',
          role: UserRole.SuperAdmin,
          passwordCheakRole: PasswordCheakRole.A,
          passwordCheakFindWord: 'SYSTEM',
        });

        await manager.save(admin);
        console.log('✅ SuperAdmin seed completed');
      }
    });
  }
}
