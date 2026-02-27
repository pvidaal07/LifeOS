import { ValueObject } from '../../common';

export type ReviewStatusValue = 'pending' | 'completed' | 'skipped';

const VALID_STATUSES: ReviewStatusValue[] = ['pending', 'completed', 'skipped'];

export class ReviewStatus extends ValueObject<ReviewStatusValue> {
  static readonly PENDING = new ReviewStatus('pending');
  static readonly COMPLETED = new ReviewStatus('completed');
  static readonly SKIPPED = new ReviewStatus('skipped');

  static create(value: string): ReviewStatus {
    return new ReviewStatus(value as ReviewStatusValue);
  }

  get isPending(): boolean {
    return this._value === 'pending';
  }

  get isCompleted(): boolean {
    return this._value === 'completed';
  }

  get isSkipped(): boolean {
    return this._value === 'skipped';
  }

  canTransitionTo(target: ReviewStatus): boolean {
    if (this.isPending) return target.isCompleted || target.isSkipped;
    return false; // completed and skipped are terminal states
  }

  protected validate(value: ReviewStatusValue): void {
    if (!VALID_STATUSES.includes(value)) {
      throw new Error(`Estado de review inválido: '${value}'`);
    }
  }
}
