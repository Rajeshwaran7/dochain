import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import {
  Conversation,
  Message,
  MessageSenderType,
  MessageStatus,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
  UserRole,
} from '@dochain/database';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  private async assertCareRelationship(doctorId: string, patientId: string): Promise<void> {
    const n = await this.appointmentRepo.count({
      where: {
        doctorId,
        patientId,
        status: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
        ]),
      },
    });
    if (n === 0) throw new ForbiddenException('Messaging is available after an appointment exists.');
  }

  /**
   * Finds or creates a conversation scoped to doctor+patient (+ optional appointment).
   */
  async openConversation(userId: string, role: UserRole, dto: OpenConversationDto): Promise<Conversation> {
    if (role === UserRole.DOCTOR) {
      if (!dto.patientId) throw new BadRequestException('patientId is required');
      const doctor = await this.doctorRepo.findOne({ where: { userId } });
      if (!doctor) throw new NotFoundException('Doctor not found');
      await this.assertCareRelationship(doctor.id, dto.patientId);
      return this.findOrCreate(doctor.id, dto.patientId, dto.appointmentId ?? null);
    }

    if (role === UserRole.PATIENT) {
      if (!dto.doctorId) throw new BadRequestException('doctorId is required');
      const patient = await this.patientRepo.findOne({ where: { userId } });
      if (!patient) throw new NotFoundException('Patient not found');
      await this.assertCareRelationship(dto.doctorId, patient.id);
      return this.findOrCreate(dto.doctorId, patient.id, dto.appointmentId ?? null);
    }

    throw new ForbiddenException();
  }

  private async findOrCreate(
    doctorId: string,
    patientId: string,
    appointmentId: string | null,
  ): Promise<Conversation> {
    const existing = await this.convRepo.findOne({
      where: appointmentId
        ? { doctorId, patientId, appointmentId }
        : { doctorId, patientId, appointmentId: IsNull() },
    });
    if (existing) return existing;

    const created = this.convRepo.create({
      doctorId,
      patientId,
      appointmentId: appointmentId ?? null,
    });
    return this.convRepo.save(created);
  }

  /**
   * Lists conversations for the current user.
   */
  async listConversations(userId: string, role: UserRole): Promise<Conversation[]> {
    if (role === UserRole.DOCTOR) {
      const doctor = await this.doctorRepo.findOne({ where: { userId } });
      if (!doctor) throw new NotFoundException('Doctor not found');
      return this.convRepo.find({
        where: { doctorId: doctor.id },
        relations: ['patient', 'patient.user'],
        order: { updatedAt: 'DESC' },
      });
    }
    if (role === UserRole.PATIENT) {
      const patient = await this.patientRepo.findOne({ where: { userId } });
      if (!patient) throw new NotFoundException('Patient not found');
      return this.convRepo.find({
        where: { patientId: patient.id },
        relations: ['doctor', 'doctor.user'],
        order: { updatedAt: 'DESC' },
      });
    }
    throw new ForbiddenException();
  }

  private async assertMember(
    conversationId: string,
    userId: string,
    role: UserRole,
  ): Promise<Conversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    const patient = await this.patientRepo.findOne({ where: { userId } });

    if (role === UserRole.DOCTOR && doctor?.id === conv.doctorId) return conv;
    if (role === UserRole.PATIENT && patient?.id === conv.patientId) return conv;

    throw new ForbiddenException();
  }

  /**
   * Returns messages and marks inbound items as delivered for this recipient.
   */
  async getMessages(
    conversationId: string,
    userId: string,
    role: UserRole,
  ): Promise<Message[]> {
    await this.assertMember(conversationId, userId, role);

    const list = await this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 200,
    });

    const inbound = list.filter((m) => {
      if (role === UserRole.PATIENT && m.senderType === MessageSenderType.DOCTOR) return true;
      if (role === UserRole.DOCTOR && m.senderType === MessageSenderType.PATIENT) return true;
      return false;
    });

    for (const m of inbound) {
      if (m.status === MessageStatus.SENT) {
        m.status = MessageStatus.DELIVERED;
        await this.msgRepo.save(m);
      }
    }

    return this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 200,
    });
  }

  /**
   * Sends a text message in a conversation.
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    role: UserRole,
    dto: SendMessageDto,
  ): Promise<Message> {
    const conv = await this.assertMember(conversationId, userId, role);

    const body = dto.body?.trim() ?? '';
    if (!body) throw new BadRequestException('Message body is required');

    const senderType =
      role === UserRole.DOCTOR ? MessageSenderType.DOCTOR : MessageSenderType.PATIENT;

    const msg = this.msgRepo.create({
      conversationId: conv.id,
      senderType,
      body,
      status: MessageStatus.SENT,
    });
    const saved = await this.msgRepo.save(msg);

    await this.convRepo.update({ id: conv.id }, { updatedAt: new Date() });

    return saved;
  }

  /**
   * Marks all inbound messages as read.
   */
  async markRead(conversationId: string, userId: string, role: UserRole): Promise<void> {
    await this.assertMember(conversationId, userId, role);

    const senderType =
      role === UserRole.PATIENT ? MessageSenderType.DOCTOR : MessageSenderType.PATIENT;

    await this.msgRepo.update(
      {
        conversationId,
        senderType,
        status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
      },
      { status: MessageStatus.READ },
    );
  }
}
