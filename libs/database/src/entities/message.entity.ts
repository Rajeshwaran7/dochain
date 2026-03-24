import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageSenderType {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn()
  conversation: Conversation;

  @Column()
  conversationId: string;

  @Column({ type: 'enum', enum: MessageSenderType })
  senderType: MessageSenderType;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'text', nullable: true })
  attachmentUrl: string;

  @Column({ nullable: true })
  attachmentPublicId: string;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @CreateDateColumn()
  createdAt: Date;
}
