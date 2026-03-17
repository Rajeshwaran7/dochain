import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, Doctor, Patient, Appointment, AppointmentStatus } from '@dochain/database';

export class CreateReviewDto {
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment?: string;
}

export class ReplyReviewDto {
  reply: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { id: dto.appointmentId, patientId: patient.id },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status !== AppointmentStatus.COMPLETED)
      throw new BadRequestException('Can only review completed appointments');

    const existing = await this.reviewRepo.findOne({
      where: { appointmentId: dto.appointmentId },
    });
    if (existing) throw new BadRequestException('Review already submitted for this appointment');

    if (dto.rating < 1 || dto.rating > 5)
      throw new BadRequestException('Rating must be between 1 and 5');

    const review = this.reviewRepo.create({
      ...dto,
      patientId: patient.id,
    });
    const saved = await this.reviewRepo.save(review);

    // Recalculate doctor's average rating
    await this.recalculateRating(dto.doctorId);

    return saved;
  }

  async getDoctorReviews(doctorId: string, page = 1, limit = 10) {
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { doctorId, isVisible: true },
      relations: ['patient', 'patient.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  async replyToReview(reviewId: string, userId: string, dto: ReplyReviewDto) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['doctor'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.doctor.userId !== userId) throw new ForbiddenException();

    review.doctorReply = dto.reply;
    review.doctorRepliedAt = new Date();
    return this.reviewRepo.save(review);
  }

  private async recalculateRating(doctorId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.doctorId = :doctorId', { doctorId })
      .andWhere('review.isVisible = true')
      .getRawOne();

    await this.doctorRepo.update(doctorId, {
      averageRating: parseFloat(result.avg) || 0,
      totalReviews: parseInt(result.count) || 0,
    });
  }
}
