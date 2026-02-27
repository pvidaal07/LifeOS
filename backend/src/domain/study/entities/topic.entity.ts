import { Entity } from '../../common';
import { TopicStatus } from '../value-objects/topic-status.vo';

export interface TopicProps {
  id: string;
  subjectId: string;
  name: string;
  description: string | null;
  masteryLevel: number;
  systemMasteryLevel: number;
  status: TopicStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Topic extends Entity {
  private _subjectId: string;
  private _name: string;
  private _description: string | null;
  private _masteryLevel: number;
  private _systemMasteryLevel: number;
  private _status: TopicStatus;
  private _displayOrder: number;

  private constructor(props: TopicProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._subjectId = props.subjectId;
    this._name = props.name;
    this._description = props.description;
    this._masteryLevel = props.masteryLevel;
    this._systemMasteryLevel = props.systemMasteryLevel;
    this._status = props.status;
    this._displayOrder = props.displayOrder;
  }

  get subjectId(): string {
    return this._subjectId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get masteryLevel(): number {
    return this._masteryLevel;
  }

  get systemMasteryLevel(): number {
    return this._systemMasteryLevel;
  }

  get status(): TopicStatus {
    return this._status;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  static create(params: {
    id: string;
    subjectId: string;
    name: string;
    description?: string | null;
  }): Topic {
    const now = new Date();
    return new Topic({
      id: params.id,
      subjectId: params.subjectId,
      name: params.name,
      description: params.description ?? null,
      masteryLevel: 1,
      systemMasteryLevel: 0,
      status: TopicStatus.NOT_STARTED,
      displayOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: TopicProps): Topic {
    return new Topic(props);
  }

  update(params: {
    name?: string;
    description?: string | null;
    masteryLevel?: number;
    displayOrder?: number;
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.description !== undefined) this._description = params.description;
    if (params.masteryLevel !== undefined) this._masteryLevel = params.masteryLevel;
    if (params.displayOrder !== undefined) this._displayOrder = params.displayOrder;
    this._updatedAt = new Date();
  }

  markInProgress(): void {
    if (this._status.isNotStarted) {
      this._status = TopicStatus.IN_PROGRESS;
      this._updatedAt = new Date();
    }
  }

  updateSystemMastery(level: number, newStatus: TopicStatus): void {
    this._systemMasteryLevel = level;
    this._status = newStatus;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      subjectId: this.subjectId,
      name: this.name,
      description: this.description,
      status: this.status.value,
      masteryLevel: this.masteryLevel,
      systemMasteryLevel: this.systemMasteryLevel,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
