import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MedicalRecordEntry } from './medical-record-entry.entity';

@Entity('medical_attachments')
export class MedicalAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MedicalRecordEntry, { onDelete: 'CASCADE' })
  @JoinColumn()
  entry: MedicalRecordEntry;

  @Column()
  entryId: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ nullable: true })
  filePublicId: string;

  @Column()
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;
}
