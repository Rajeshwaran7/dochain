import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@dochain/database';
import { UpdatePatientDto } from './dto/update-patient.dto';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
@ApiBearerAuth()
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get patient profile' })
  async getProfile(@Request() req) {
    return this.patientsService.getProfile(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update patient profile' })
  async updateProfile(@Request() req, @Body() dto: UpdatePatientDto) {
    return this.patientsService.updateProfile(req.user.id, dto);
  }
}
