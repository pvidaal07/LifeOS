import { AggregateRoot } from '../../common';
import { PlanStatus } from '../value-objects/plan-status.vo';

export interface StudyPlanProps {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: PlanStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class StudyPlan extends AggregateRoot {
  private _userId: string;
  private _name: string;
  private _description: string | null;
  private _status: PlanStatus;
  private _displayOrder: number;

  private constructor(props: StudyPlanProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._userId = props.userId;
    this._name = props.name;
    this._description = props.description;
    this._status = props.status;
    this._displayOrder = props.displayOrder;
  }

  get userId(): string {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get status(): PlanStatus {
    return this._status;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  isOwnedBy(userId: string): boolean {
    return this._userId === userId;
  }

  static create(params: {
    id: string;
    userId: string;
    name: string;
    description?: string | null;
  }): StudyPlan {
    const now = new Date();
    return new StudyPlan({
      id: params.id,
      userId: params.userId,
      name: params.name,
      description: params.description ?? null,
      status: PlanStatus.ACTIVE,
      displayOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: StudyPlanProps): StudyPlan {
    return new StudyPlan(props);
  }

  update(params: {
    name?: string;
    description?: string | null;
    status?: PlanStatus;
    displayOrder?: number;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.description !== undefined) this._description = params.description;
    if (params.status !== undefined) this._status = params.status;
    if (params.displayOrder !== undefined) this._displayOrder = params.displayOrder;
    this._updatedAt = new Date();
  }
}
