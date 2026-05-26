import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { MailService } from './mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
