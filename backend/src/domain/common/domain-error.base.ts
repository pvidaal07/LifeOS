export abstract class DomainError extends Error {
  public readonly details?: Record<string, unknown>;
  public readonly httpStatus?: number;

  constructor(
    public readonly code: string,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      httpStatus?: number;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.details = options?.details;
    this.httpStatus = options?.httpStatus;
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super('ENTITY_NOT_FOUND', `${entityName} con id '${id}' no encontrado`);
  }
}

export class OwnershipViolationError extends DomainError {
  constructor() {
    super('OWNERSHIP_VIOLATION', 'No tienes permisos para acceder a este recurso');
  }
}

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super('INVALID_OPERATION', message);
  }
}

export class DuplicateError extends DomainError {
  constructor(entityName: string, field: string, value: string) {
    super('DUPLICATE', `${entityName} con ${field} '${value}' ya existe`);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Credenciales invalidas');
  }
}

export class AccountDisabledError extends DomainError {
  constructor() {
    super('ACCOUNT_DISABLED', 'Cuenta desactivada');
  }
}
