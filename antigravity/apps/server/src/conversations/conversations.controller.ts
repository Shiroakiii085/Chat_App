import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards, Request, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDirectDto } from './dto/create-direct.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { Role } from '@prisma/client';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('direct')
  createDirect(@Request() req: any, @Body() dto: CreateDirectDto) {
    return this.conversationsService.createDirect(req.user.id, dto);
  }

  @Post('group')
  createGroup(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.conversationsService.createGroup(req.user.id, dto);
  }

  @Post('channel')
  createChannel(@Request() req: any, @Body() dto: CreateChannelDto) {
    return this.conversationsService.createChannel(req.user.id, dto);
  }

  @Get()
  getConversations(@Request() req: any) {
    return this.conversationsService.getConversations(req.user.id);
  }

  @Get(':id/messages')
  getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.conversationsService.getMessages(id, req.user.id, cursor, limit);
  }

  @Post(':id/members')
  addMember(@Request() req: any, @Param('id') id: string, @Body('userId') newUserId: string) {
    return this.conversationsService.addMember(id, req.user.id, newUserId);
  }

  @Delete(':id/members/:userId')
  kickMember(@Request() req: any, @Param('id') id: string, @Param('userId') targetUserId: string) {
    return this.conversationsService.kickMember(id, req.user.id, targetUserId);
  }

  @Patch(':id/members/:userId/role')
  updateRole(@Request() req: any, @Param('id') id: string, @Param('userId') targetUserId: string, @Body('role') role: Role) {
    return this.conversationsService.updateRole(id, req.user.id, targetUserId, role);
  }
}
