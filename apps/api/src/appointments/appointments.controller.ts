import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AppointmentStatus } from '@dochain/database';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Book an appointment' })
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.id, dto);
  }

  @Get('patient')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get patient appointments' })
  async getPatientAppointments(
    @Request() req,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.getPatientAppointments(req.user.id, status);
  }

  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get doctor appointments' })
  async getDoctorAppointments(
    @Request() req,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.getDoctorAppointments(req.user.id, date, status);
  }

  @Get('doctor/stats')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get doctor appointment stats' })
  async getDoctorStats(@Request() req) {
    return this.appointmentsService.getDoctorStats(req.user.id);
  }

  @Get('doctor/monthly')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get doctor monthly appointment chart data' })
  async getDoctorMonthlyStats(@Request() req) {
    return this.appointmentsService.getDoctorMonthlyStats(req.user.id);
  }

  @Get('slots/:doctorId')
  @ApiOperation({ summary: 'Get available slots for a doctor on a date' })
  async getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(doctorId, date);
  }

  @Post(':id/verify-payment')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Verify Razorpay payment for appointment' })
  async verifyPayment(
    @Param('id') id: string,
    @Body() body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    return this.appointmentsService.verifyPayment(
      id,
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async getById(@Param('id') id: string) {
    return this.appointmentsService.getById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, req.user.id, req.user.role, dto);
  }
}
