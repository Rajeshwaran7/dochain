import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@dochain/database';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

@ApiTags('Medical records')
@Controller('medical-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('for-patient/:patientId')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List records for a patient (doctor)' })
  async listForPatient(@Request() req: { user: { id: string } }, @Param('patientId') patientId: string) {
    return this.medicalRecordsService.listForPatientByDoctor(req.user.id, patientId);
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List my medical records' })
  async listMine(@Request() req: { user: { id: string } }) {
    return this.medicalRecordsService.listMineAsPatient(req.user.id);
  }

  @Post()
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add a visit record' })
  async create(@Request() req: { user: { id: string } }, @Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(req.user.id, dto);
  }
}
