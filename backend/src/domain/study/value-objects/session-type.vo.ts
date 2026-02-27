import { ValueObject } from '../../common';

export type SessionTypeValue = 'first_time' | 'review' | 'practice';

const VALID_TYPES: SessionTypeValue[] = ['first_time', 'review', 'practice'];

export class SessionType extends ValueObject<SessionTypeValue> {
  static readonly FIRST_TIME = new SessionType('first_time');
  static readonly REVIEW = new SessionType('review');
  static readonly PRACTICE = new SessionType('practice');

  static create(value: string): SessionType {
    return new SessionType(value as SessionTypeValue);
  }

  get isFirstTime(): boolean {
    return this._value === 'first_time';
  }

  get isReview(): boolean {
    return this._value === 'review';
  }

  get isPractice(): boolean {
    return this._value === 'practice';
  }

  protected validate(value: SessionTypeValue): void {
    if (!VALID_TYPES.includes(value)) {
      throw new Error(
        `Tipo de sesión inválido: '${value}'. Valores permitidos: ${VALID_TYPES.join(', ')}`,
      );
    }
  }
}
