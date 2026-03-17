import {
  Controller, Get, Post, Put, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, DoctorStatus } from '@dochain/database';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('doctors')
  @ApiOperation({ summary: 'List all doctors' })
  async listDoctors(
    @Query('status') status?: DoctorStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.listDoctors(status, +page, +limit);
  }

  @Put('doctors/:id/approve')
  @ApiOperation({ summary: 'Approve a doctor' })
  async approveDoctor(@Param('id') id: string) {
    return this.adminService.approveDoctor(id);
  }

  @Put('doctors/:id/reject')
  @ApiOperation({ summary: 'Reject a doctor' })
  async rejectDoctor(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.rejectDoctor(id, reason);
  }

  @Put('doctors/:id/suspend')
  @ApiOperation({ summary: 'Suspend a doctor' })
  async suspendDoctor(@Param('id') id: string) {
    return this.adminService.suspendDoctor(id);
  }

  @Get('patients')
  @ApiOperation({ summary: 'List all patients' })
  async listPatients(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listPatients(+page, +limit);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all subscriptions' })
  async listSubscriptions(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.listSubscriptions(+page, +limit);
  }

  @Put('users/:id/toggle')
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleUser(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }
}
