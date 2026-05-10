import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MessageType, Role, ConversationType } from '@prisma/client';

interface SendMessageDto {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new Error('No token provided');

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      });
      const userId = payload.sub;

      client.data.user = { id: userId };

      // Load user's conversations and join rooms
      const memberships = await this.prisma.conversationMember.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      memberships.forEach((m) => client.join(m.conversationId));

      // Set online status in Redis with 35s TTL
      await this.redis.set(`online:${userId}`, '1', 'EX', 35);

      // Broadcast online status to everyone (or specific rooms)
      this.server.emit('user_status', { userId, isOnline: true });
    } catch (e) {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.id;
    if (userId) {
      // Check if user still has other connected sockets before setting offline
      const matchingSockets = await this.server.in(userId).fetchSockets();
      if (matchingSockets.length === 0) {
        await this.redis.del(`online:${userId}`);
        this.server.emit('user_status', { userId, isOnline: false });
      }
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.id;
    if (userId) {
      await this.redis.expire(`online:${userId}`, 35);
    }
    return { status: 'ok' };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.user.id;

    // Verify membership
    const membership = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId: dto.conversationId, userId },
      },
      include: { conversation: true },
    });

    if (!membership) {
      return { error: 'FORBIDDEN' };
    }

    if (membership.conversation.type === ConversationType.CHANNEL) {
      if (membership.role === Role.MEMBER) {
        return { error: 'FORBIDDEN_CHANNEL_MESSAGE' };
      }
    }

    // Save message to DB
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: userId,
        content: dto.content,
        type: dto.type || MessageType.TEXT,
        replyToId: dto.replyToId,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    // Broadcast via socket.io (this uses Redis Adapter under the hood to scale across instances)
    this.server.to(dto.conversationId).emit('new_message', {
      message,
    });

    return message;
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(data.conversationId).emit('user_typing', {
      userId: client.data.user.id,
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(data.conversationId).emit('user_typing', {
      userId: client.data.user.id,
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const userId = client.data.user.id;

    await this.prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId: data.conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });

    this.server.to(data.conversationId).emit('message_read', {
      userId,
      conversationId: data.conversationId,
      messageId: data.messageId,
    });
  }
}
