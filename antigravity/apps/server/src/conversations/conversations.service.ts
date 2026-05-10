import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectDto } from './dto/create-direct.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ConversationType, Role } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async createDirect(userId: string, dto: CreateDirectDto) {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Cannot create a direct message with yourself');
    }

    // Check if DM already exists
    const existingDm = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        members: {
          every: {
            userId: { in: [userId, dto.targetUserId] },
          },
        },
      },
      include: { members: true },
    });

    if (existingDm && existingDm.members.length === 2) {
      return existingDm;
    }

    // Create new DM
    return this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        members: {
          create: [
            { userId, role: Role.MEMBER },
            { userId: dto.targetUserId, role: Role.MEMBER },
          ],
        },
      },
      include: { members: true },
    });
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const allMembers = Array.from(new Set([userId, ...dto.memberIds]));
    if (allMembers.length < 2) {
      throw new BadRequestException('Group must have at least 2 members');
    }

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        name: dto.name,
        members: {
          create: allMembers.map((id) => ({
            userId: id,
            role: id === userId ? Role.OWNER : Role.MEMBER,
          })),
        },
      },
      include: { members: true },
    });
  }

  async createChannel(userId: string, dto: CreateChannelDto) {
    return this.prisma.conversation.create({
      data: {
        type: ConversationType.CHANNEL,
        name: dto.name,
        // we can store description in a separate table or just omit if schema doesn't have it
        members: {
          create: [
            { userId, role: Role.OWNER },
          ],
        },
      },
      include: { members: true },
    });
  }

  async getConversations(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            members: {
              take: 5,
              include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
            }
          },
        },
      },
    });

    return memberships.map((m) => {
      const conv = m.conversation;
      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        avatarUrl: conv.avatarUrl,
        createdAt: conv.createdAt,
        lastMessage: conv.messages[0] || null,
        members: conv.members,
        // Unread logic would depend on comparing m.lastReadAt with messages
        // For simplicity we just return the joined data.
        lastReadAt: m.lastReadAt,
      };
    });
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    // Check if member
    const membership = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
  }

  async addMember(conversationId: string, requesterId: string, newUserId: string) {
    const requester = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: requesterId } },
    });

    if (!requester || (requester.role !== Role.OWNER && requester.role !== Role.ADMIN)) {
      throw new ForbiddenException('Not authorized to add members');
    }

    return this.prisma.conversationMember.create({
      data: {
        conversationId,
        userId: newUserId,
        role: Role.MEMBER,
      },
    });
  }

  async kickMember(conversationId: string, requesterId: string, targetUserId: string) {
    const requester = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: requesterId } },
    });

    if (!requester || (requester.role !== Role.OWNER && requester.role !== Role.ADMIN)) {
      throw new ForbiddenException('Not authorized to kick members');
    }

    return this.prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    });
  }

  async updateRole(conversationId: string, requesterId: string, targetUserId: string, newRole: Role) {
    const requester = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: requesterId } },
    });

    if (!requester || requester.role !== Role.OWNER) {
      throw new ForbiddenException('Only OWNER can change roles');
    }

    return this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
      data: { role: newRole },
    });
  }
}
