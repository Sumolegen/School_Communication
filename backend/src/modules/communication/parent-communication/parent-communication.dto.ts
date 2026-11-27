import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsUUID()
  threadId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  receiverUserId?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsUUID()
  attachmentFileId?: string;
}
