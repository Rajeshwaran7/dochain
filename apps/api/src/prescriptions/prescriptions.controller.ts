import { Controller, Get, Post, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@dochain/database';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create prescription and PDF' })
  async create(@Request() req: { user: { id: string } }, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(req.user.id, dto);
  }

  @Get('for-patient/:patientId')
  @Roles(UserRole.DOCTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List prescriptions for a patient (doctor)' })
  async listForPatient(
    @Request() req: { user: { id: string } },
    @Param('patientId') patientId: string,
  ) {
    return this.prescriptionsService.listForPatientDoctor(req.user.id, patientId);
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List my prescriptions' })
  async listMine(@Request() req: { user: { id: string } }) {
    return this.prescriptionsService.listMineAsPatient(req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download prescription PDF (send Authorization header; avoids browser 401 on private Cloudinary)',
  })
  async downloadPdf(
    @Request() req: { user: { id: string; role: UserRole } },
    @Param('id') id: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const buf = await this.prescriptionsService.getPdfBufferForUser(id, req.user.id, req.user.role);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="prescription.pdf"');
    res.send(buf);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by id (doctor or patient owner)' })
  async getOne(@Request() req: { user: { id: string; role: UserRole } }, @Param('id') id: string) {
    return this.prescriptionsService.getByIdForUser(id, req.user.id, req.user.role);
  }
}
