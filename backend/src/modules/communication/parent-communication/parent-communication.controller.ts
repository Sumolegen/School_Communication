import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { SendMessageDto } from './parent-communication.dto';
import { ParentCommunicationService } from './parent-communication.service';

@Controller('messages')
export class ParentCommunicationController {
  constructor(private readonly service: ParentCommunicationService) {}

  @Get('threads')
  listThreads(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    return this.service.listThreads(user, studentId);
  }

  @Get('contacts')
  getContacts(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    return this.service.getAvailableContacts(user, studentId);
  }

  @Get('threads/:threadId')
  getMessages(@Param('threadId', ParseUuidPipe) threadId: string, @CurrentUser() user: AuthUser) {
    return this.service.getMessages(threadId, user);
  }

  @Post('threads/:threadId/read')
  markRead(@Param('threadId', ParseUuidPipe) threadId: string, @CurrentUser() user: AuthUser) {
    return this.service.markThreadRead(threadId, user);
  }

  @RequirePermissions('MESSAGE_SEND')
  @Post('send')
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: AuthUser) {
    return this.service.sendMessage(dto, user);
  }
}
