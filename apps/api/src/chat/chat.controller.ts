import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@dochain/database';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List my conversations' })
  async list(@Request() req: { user: { id: string; role: UserRole } }) {
    return this.chatService.listConversations(req.user.id, req.user.role);
  }

  @Post('conversations/open')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Open or create a conversation' })
  async open(@Request() req: { user: { id: string; role: UserRole } }, @Body() dto: OpenConversationDto) {
    return this.chatService.openConversation(req.user.id, req.user.role, dto);
  }

  @Get('conversations/:id/messages')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List messages (marks inbound as delivered)' })
  async messages(@Request() req: { user: { id: string; role: UserRole } }, @Param('id') id: string) {
    return this.chatService.getMessages(id, req.user.id, req.user.role);
  }

  @Post('conversations/:id/messages')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Send a text message' })
  async send(
    @Request() req: { user: { id: string; role: UserRole } },
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, req.user.id, req.user.role, dto);
  }

  @Post('conversations/:id/read')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mark inbound messages as read' })
  async read(@Request() req: { user: { id: string; role: UserRole } }, @Param('id') id: string) {
    await this.chatService.markRead(id, req.user.id, req.user.role);
    return { ok: true };
  }
}
