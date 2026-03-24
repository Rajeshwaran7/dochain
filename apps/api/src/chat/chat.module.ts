import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation, Message, Doctor, Patient, Appointment } from '@dochain/database';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Doctor, Patient, Appointment])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
