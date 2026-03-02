import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { EmailVerificationSenderPort } from '../../../application/ports/email-verification.port';
import { buildEmailVerificationTemplate } from './email-verification-template.builder';

interface SmtpEmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
  connectionTimeoutMs: number;
  sendTimeoutMs: number;
  brandName: string;
  appUrl?: string;
  supportEmail?: string;
}

@Injectable()
export class SmtpEmailVerificationSenderService implements EmailVerificationSenderPort {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly smtpConfig: SmtpEmailConfig;

  constructor(private readonly configService: ConfigService) {
    const smtpConfig = this.getSmtpConfig();
    this.smtpConfig = smtpConfig;
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
    const template = buildEmailVerificationTemplate({
      recipientName: input.name,
      code: input.code,
      expiresInMinutes: input.expiresInMinutes,
      brandName: this.smtpConfig.brandName,
      appUrl: this.smtpConfig.appUrl,
      supportEmail: this.smtpConfig.supportEmail,
    });

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.toEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
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
      brandName: this.configService.get<string>('emailVerification.template.brandName', 'LifeOS'),
      appUrl: this.configService.get<string | undefined>('emailVerification.template.appUrl'),
      supportEmail: this.configService.get<string | undefined>('emailVerification.template.supportEmail'),
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
