import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // 1. Import ConfigService
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  // 2. Inject the ConfigService into the constructor
  constructor(private configService: ConfigService) {
    // 3. Create the transporter inside the constructor!
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
    // We also use ConfigService here to get the 'from' email!
    const fromEmail = this.configService.get<string>('SMTP_USER');
    await this.transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>

        <a href="${resetLink}">
          Reset Password
        </a>

        <p>This link expires in 1 hour.</p>
      `,
    });
  }
}
