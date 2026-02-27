import { Entity } from '../../common';

export interface SubjectProps {
  id: string;
  studyPlanId: string;
  name: string;
  description: string | null;
  color: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Subject extends Entity {
  private _studyPlanId: string;
  private _name: string;
  private _description: string | null;
  private _color: string;
  private _displayOrder: number;

  private constructor(props: SubjectProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._studyPlanId = props.studyPlanId;
    this._name = props.name;
    this._description = props.description;
    this._color = props.color;
    this._displayOrder = props.displayOrder;
  }

  get studyPlanId(): string {
    return this._studyPlanId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get color(): string {
    return this._color;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  static create(params: {
    id: string;
    studyPlanId: string;
    name: string;
    description?: string | null;
    color?: string;
  }): Subject {
    const now = new Date();
    return new Subject({
      id: params.id,
      studyPlanId: params.studyPlanId,
      name: params.name,
      description: params.description ?? null,
      color: params.color ?? '#6366f1',
      displayOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: SubjectProps): Subject {
    return new Subject(props);
  }

  update(params: {
    name?: string;
    description?: string | null;
    color?: string;
    displayOrder?: number;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.description !== undefined) this._description = params.description;
    if (params.color !== undefined) this._color = params.color;
    if (params.displayOrder !== undefined) this._displayOrder = params.displayOrder;
    this._updatedAt = new Date();
  }
}
