import { ValueObject } from '../../common';

export type TopicStatusValue = 'not_started' | 'in_progress' | 'mastered';

const VALID_STATUSES: TopicStatusValue[] = [
  'not_started',
  'in_progress',
  'mastered',
];

export class TopicStatus extends ValueObject<TopicStatusValue> {
  static readonly NOT_STARTED = new TopicStatus('not_started');
  static readonly IN_PROGRESS = new TopicStatus('in_progress');
  static readonly MASTERED = new TopicStatus('mastered');

  static create(value: string): TopicStatus {
    if (!VALID_STATUSES.includes(value as TopicStatusValue)) {
      throw new Error(
        `Estado de topic inválido: '${value}'. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
      );
    }
    return new TopicStatus(value as TopicStatusValue);
  }

  get isNotStarted(): boolean {
    return this._value === 'not_started';
  }

  get isInProgress(): boolean {
    return this._value === 'in_progress';
  }

  get isMastered(): boolean {
    return this._value === 'mastered';
  }

  protected validate(value: TopicStatusValue): void {
    if (!VALID_STATUSES.includes(value)) {
      throw new Error(
        `Estado de topic inválido: '${value}'. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
}
