import { DomainError, EntityNotFoundError } from '../../common';

export class ReviewNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Review', id);
  }
}

export class ReviewAlreadyCompletedError extends DomainError {
  constructor(id: string) {
    super('REVIEW_ALREADY_COMPLETED', `La review '${id}' ya fue completada`);
  }
}

export class InvalidReviewTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      'INVALID_REVIEW_TRANSITION',
      `Transición de review inválida: '${from}' → '${to}'`,
    );
  }
}
