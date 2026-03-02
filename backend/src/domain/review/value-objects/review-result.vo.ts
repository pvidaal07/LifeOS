import { ValueObject } from '../../common';

export type ReviewResultValue = 'perfect' | 'good' | 'regular' | 'bad';

const VALID_RESULTS: ReviewResultValue[] = ['perfect', 'good', 'regular', 'bad'];

export class ReviewResult extends ValueObject<ReviewResultValue> {
  static readonly PERFECT = new ReviewResult('perfect');
  static readonly GOOD = new ReviewResult('good');
  static readonly REGULAR = new ReviewResult('regular');
  static readonly BAD = new ReviewResult('bad');

  static create(value: string): ReviewResult {
    if (!VALID_RESULTS.includes(value as ReviewResultValue)) {
      throw new Error(
        `Resultado de review inválido: '${value}'. Valores permitidos: ${VALID_RESULTS.join(', ')}`,
      );
    }
    return new ReviewResult(value as ReviewResultValue);
  }

  get isPerfect(): boolean {
    return this._value === 'perfect';
  }

  get isGood(): boolean {
    return this._value === 'good';
  }

  get isRegular(): boolean {
    return this._value === 'regular';
  }

  get isBad(): boolean {
    return this._value === 'bad';
  }

  get isSuccessful(): boolean {
    return this.isPerfect || this.isGood;
  }

  protected validate(value: ReviewResultValue): void {
    if (!VALID_RESULTS.includes(value)) {
      throw new Error(
        `Resultado de review inválido: '${value}'. Valores permitidos: ${VALID_RESULTS.join(', ')}`,
      );
    }
  }
}
