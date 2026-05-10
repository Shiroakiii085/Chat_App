import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    RedisModule,
    ConversationsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
