import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { EmailVerificationSenderPort } from '../../../application/ports/email-verification.port';

interface SmtpEmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
  connectionTimeoutMs: number;
  sendTimeoutMs: number;
}

@Injectable()
export class SmtpEmailVerificationSenderService implements EmailVerificationSenderPort {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const smtpConfig = this.getSmtpConfig();
    const secure = smtpConfig.secure ?? smtpConfig.port === 465;

    this.transporter = createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      connectionTimeout: smtpConfig.connectionTimeoutMs,
      socketTimeout: smtpConfig.sendTimeoutMs,
    });
    this.fromAddress = smtpConfig.from;
  }

  async sendVerificationCode(input: {
    toEmail: string;
    name: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.toEmail,
        subject: 'LifeOS - Codigo de verificacion',
        text: `Hola ${input.name},\n\nTu codigo de verificacion es: ${input.code}\n\nEste codigo expira en ${input.expiresInMinutes} minutos.`,
      });
    } catch (error) {
      const deliveryError = new Error('SMTP email verification delivery failed');
      (deliveryError as Error & { cause?: unknown }).cause = error;
      throw deliveryError;
    }
  }

  private getSmtpConfig(): SmtpEmailConfig {
    return {
      host: this.getRequiredString('emailVerification.smtp.host'),
      port: this.getRequiredNumber('emailVerification.smtp.port'),
      user: this.getRequiredString('emailVerification.smtp.user'),
      pass: this.getRequiredString('emailVerification.smtp.pass'),
      from: this.getRequiredString('emailVerification.smtp.from'),
      secure: this.configService.get<boolean | undefined>('emailVerification.smtp.secure'),
      connectionTimeoutMs: this.getRequiredNumber('emailVerification.smtp.connectionTimeoutMs'),
      sendTimeoutMs: this.getRequiredNumber('emailVerification.smtp.sendTimeoutMs'),
    };
  }

  private getRequiredString(key: string): string {
    const value = this.configService.get<string | undefined>(key);
    if (!value) {
      throw new Error(`Missing configuration value: ${key}`);
    }

    return value;
  }

  private getRequiredNumber(key: string): number {
    const value = this.configService.get<number | undefined>(key);
    if (value === undefined || Number.isNaN(value)) {
      throw new Error(`Missing configuration value: ${key}`);
    }

    return value;
  }
}
