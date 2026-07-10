import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { MailService } from '../common/mail/mail.service';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../../generated/prisma/enums';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateRecruiterUserData } from './dto/create-recruiter.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new BadRequestException('Candidate already exists!');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersService.createCandidate({
      ...data,
      password: hashedPassword,
    });
  }

  async login(data: LoginDto) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.isActive && user.role !== Role.ADMIN) {
      throw new BadRequestException(
        'Account is inactive. Please try after activation',
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createRecruiter(data: CreateRecruiterUserData) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('Recruiter already exists!');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersService.createRecruiter({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    /**
     * Prevent email enumeration.
     */
    if (!user) {
      return {
        message: 'If an account exists, a reset email has been sent.',
      };
    }

    const token = randomBytes(32).toString('hex');

    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log('resetLink: ', resetLink);
    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    return {
      message: 'If an account exists, a reset email has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
      },
    });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const password = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      message: 'Password reset successfully.',
    };
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password do not match');
    }

    const password = await bcrypt.hash(data.password, 10);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Password changed successfully!',
    };
  }
}
