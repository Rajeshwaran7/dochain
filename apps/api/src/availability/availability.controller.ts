import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AvailabilityService, CreateAvailabilityDto, CreateExceptionDto } from './availability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@dochain/database';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get(':doctorId')
  @ApiOperation({ summary: 'Get doctor availability' })
  async getDoctorAvailability(@Param('doctorId') doctorId: string) {
    return this.availabilityService.getDoctorAvailability(doctorId);
  }

  @Get(':doctorId/exceptions')
  @ApiOperation({ summary: 'Get doctor availability exceptions' })
  async getExceptions(@Param('doctorId') doctorId: string) {
    return this.availabilityService.getExceptions(doctorId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set doctor availability slots' })
  async setAvailability(@Request() req, @Body() slots: CreateAvailabilityDto[]) {
    return this.availabilityService.setAvailability(req.user.id, slots);
  }

  @Post('exception')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add availability exception (holiday/custom hours)' })
  async addException(@Request() req, @Body() dto: CreateExceptionDto) {
    return this.availabilityService.addException(req.user.id, dto);
  }
}
