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
