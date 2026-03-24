import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@dochain/database';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and list approved doctors' })
  async search(@Query() dto: SearchDoctorsDto) {
    return this.doctorsService.search(dto);
  }

  @Get('specializations')
  @ApiOperation({ summary: 'Get all available specializations' })
  async getSpecializations() {
    return this.doctorsService.getSpecializations();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get all available cities' })
  async getCities() {
    return this.doctorsService.getCities();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own doctor profile' })
  async getMyProfile(@Request() req) {
    return this.doctorsService.getMyProfile(req.user.id);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload profile image (multipart field: file)' })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    if (!file?.buffer) throw new BadRequestException('file is required');
    return this.doctorsService.uploadProfileAvatar(req.user.id, file);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove profile image (fallback to initials in apps)' })
  async deleteAvatar(@Request() req) {
    return this.doctorsService.clearProfileAvatar(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  async findById(@Param('id') id: string) {
    return this.doctorsService.findById(id);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create doctor profile' })
  async createProfile(@Request() req, @Body() dto: CreateDoctorProfileDto) {
    return this.doctorsService.createProfile(req.user.id, dto);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update doctor profile' })
  async updateProfile(@Request() req, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorsService.updateProfile(req.user.id, dto);
  }

  @Post('clinic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update clinic' })
  async createClinic(@Request() req, @Body() dto: CreateClinicDto) {
    return this.doctorsService.createClinic(req.user.id, dto);
  }
}
