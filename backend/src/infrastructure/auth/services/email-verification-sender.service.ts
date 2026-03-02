import { Injectable, Logger } from '@nestjs/common';
import { EmailVerificationSenderPort } from '../../../application/ports/email-verification.port';

@Injectable()
export class EmailVerificationSenderService implements EmailVerificationSenderPort {
  private readonly logger = new Logger(EmailVerificationSenderService.name);

  async sendVerificationCode(input: {
    toEmail: string;
    name: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void> {
    this.logger.log(
      `Verification code for ${input.toEmail}: ${input.code} (expires in ${input.expiresInMinutes}m)`,
    );
  }
}
