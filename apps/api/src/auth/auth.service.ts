import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, AuthProvider, Doctor, Patient } from '@dochain/database';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/** Handles authentication, registration, email verification, and password reset. */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = this.userRepo.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role ?? UserRole.PATIENT,
      emailVerificationToken: verificationToken,
    });
    await this.userRepo.save(user);

    if (user.role === UserRole.PATIENT) {
      const patient = this.patientRepo.create({ userId: user.id, user });
      await this.patientRepo.save(patient);
    } else if (user.role === UserRole.DOCTOR) {
      const doctor = this.doctorRepo.create({
        userId: user.id,
        user,
        specialization: dto.specialization ?? 'General',
        city: dto.city ?? '',
      });
      await this.doctorRepo.save(doctor);
    }

    const baseUrl = user.role === UserRole.DOCTOR
      ? this.configService.get('DOCTOR_APP_URL', 'http://localhost:3002')
      : this.configService.get('PATIENT_APP_URL', 'http://localhost:3001');
    await this.mailService.sendVerificationEmail(user.email, user.firstName, verificationToken, baseUrl);

    const tokens = this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  /** Verifies a user's email using the token sent during registration. */
  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({ where: { emailVerificationToken: token } });
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    user.isEmailVerified = true;
    user.emailVerificationToken = '';
    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  /** Resends the verification email for the given user ID. */
  async resendVerificationEmail(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email is already verified');

    const newToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = newToken;
    await this.userRepo.save(user);

    const baseUrl = user.role === UserRole.DOCTOR
      ? this.configService.get('DOCTOR_APP_URL', 'http://localhost:3002')
      : this.configService.get('PATIENT_APP_URL', 'http://localhost:3001');
    await this.mailService.sendVerificationEmail(user.email, user.firstName, newToken, baseUrl);
    return { message: 'Verification email sent' };
  }

  /**
   * Resends verification email by email address (public endpoint).
   * Always returns the same message to prevent email enumeration.
   */
  async resendVerificationByEmail(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && !user.isEmailVerified) {
      const newToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = newToken;
      await this.userRepo.save(user);
      const baseUrl = user.role === UserRole.DOCTOR
        ? this.configService.get('DOCTOR_APP_URL', 'http://localhost:3002')
        : this.configService.get('PATIENT_APP_URL', 'http://localhost:3001');
      await this.mailService.sendVerificationEmail(user.email, user.firstName, newToken, baseUrl);
    }
    return { message: 'If your email is not verified, we have sent a new verification link.' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive', 'isEmailVerified', 'avatar'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified. Please check your inbox or resend the verification link.');
    }

    const isValid = await user.validatePassword(dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    const tokens = this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  /** Sends a password reset link if the email exists. Always returns success to prevent enumeration. */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await this.userRepo.save(user);
      const baseUrl = user.role === UserRole.DOCTOR
        ? this.configService.get('DOCTOR_APP_URL', 'http://localhost:3002')
        : this.configService.get('PATIENT_APP_URL', 'http://localhost:3001');
      await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetToken, baseUrl);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /** Resets the user's password using the token from the reset email. */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepo.findOne({ where: { passwordResetToken: dto.token } });

    if (!user) throw new BadRequestException('Invalid or expired reset token');
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.passwordResetToken = '';
    user.passwordResetExpiry = null as unknown as Date;
    await this.userRepo.save(user);

    return { message: 'Password reset successfully' };
  }

  async googleLogin(googleUser: { googleId: string; email: string; firstName: string; lastName: string; picture?: string }) {
    let user = await this.userRepo.findOne({ where: { googleId: googleUser.googleId } });

    if (!user) {
      user = await this.userRepo.findOne({ where: { email: googleUser.email } });
      if (user) {
        user.googleId = googleUser.googleId;
        user.provider = AuthProvider.GOOGLE;
        await this.userRepo.save(user);
      } else {
        user = this.userRepo.create({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          avatar: googleUser.picture,
          googleId: googleUser.googleId,
          provider: AuthProvider.GOOGLE,
          isEmailVerified: true,
          role: UserRole.PATIENT,
        });
        await this.userRepo.save(user);
        const patient = this.patientRepo.create({ userId: user.id, user });
        await this.patientRepo.save(patient);
      }
    }

    const tokens = this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let profile: Doctor | Patient | null = null;
    if (user.role === UserRole.DOCTOR) {
      profile = await this.doctorRepo.findOne({
        where: { userId },
        relations: ['clinic'],
      });
    } else if (user.role === UserRole.PATIENT) {
      profile = await this.patientRepo.findOne({ where: { userId } });
    }

    return { user: this.sanitizeUser(user), profile };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive'],
    });
    if (user && (await user.validatePassword(password))) return user;
    return null;
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '30d'),
      }),
    };
  }

  private sanitizeUser(user: User) {
    const { password, passwordResetToken, emailVerificationToken, ...sanitized } = user as unknown as Record<string, unknown>;
    return sanitized;
  }
}
