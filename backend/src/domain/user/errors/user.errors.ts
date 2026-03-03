import { DomainError, EntityNotFoundError } from '../../common';

export class UserNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Usuario', id);
  }
}

export class DuplicateEmailError extends DomainError {
  constructor(email: string) {
    super('DUPLICATE_EMAIL', `El email '${email}' ya esta registrado`);
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor(params: {
    emailMasked: string;
    cooldownSeconds: number;
  }) {
    super('EMAIL_NOT_VERIFIED', 'Debes verificar tu correo antes de iniciar sesion', {
      httpStatus: 403,
      details: {
        requiresVerification: true,
        emailMasked: params.emailMasked,
        cooldownSeconds: params.cooldownSeconds,
      },
    });
  }
}

export class VerificationCodeInvalidError extends DomainError {
  constructor() {
    super('VERIFICATION_CODE_INVALID', 'El código de verificación es inválido', {
      httpStatus: 400,
    });
  }
}

export class VerificationCodeExpiredError extends DomainError {
  constructor() {
    super('VERIFICATION_CODE_EXPIRED', 'El código de verificación ha expirado', {
      httpStatus: 400,
      details: {
        canResend: true,
      },
    });
  }
}

export class VerificationCodeCooldownError extends DomainError {
  constructor(remainingSeconds: number) {
    super('VERIFICATION_CODE_COOLDOWN', 'Debes esperar antes de solicitar otro código', {
      httpStatus: 429,
      details: {
        remainingSeconds,
      },
    });
  }
}

export class VerificationDeliveryError extends DomainError {
  constructor() {
    super('VERIFICATION_DELIVERY_FAILED', 'No pudimos enviar el correo de verificación. Inténtalo de nuevo.', {
      httpStatus: 503,
      details: {
        retriable: true,
      },
    });
  }
}

export class PasswordReuseNotAllowedError extends DomainError {
  constructor() {
    super('PASSWORD_REUSE_NOT_ALLOWED', 'La nueva contraseña debe ser diferente a la actual', {
      httpStatus: 400,
    });
  }
}
