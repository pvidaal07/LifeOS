import { ValueObject } from '../../common';

export type PlanStatusValue = 'active' | 'archived' | 'completed';

const VALID_STATUSES: PlanStatusValue[] = ['active', 'archived', 'completed'];

export class PlanStatus extends ValueObject<PlanStatusValue> {
  static readonly ACTIVE = new PlanStatus('active');
  static readonly ARCHIVED = new PlanStatus('archived');
  static readonly COMPLETED = new PlanStatus('completed');

  static create(value: string): PlanStatus {
    return new PlanStatus(value as PlanStatusValue);
  }

  get isActive(): boolean {
    return this._value === 'active';
  }

  get isArchived(): boolean {
    return this._value === 'archived';
  }

  get isCompleted(): boolean {
    return this._value === 'completed';
  }

  protected validate(value: PlanStatusValue): void {
    if (!VALID_STATUSES.includes(value)) {
      throw new Error(
        `Estado de plan inválido: '${value}'. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
      );
    }
  }
}
