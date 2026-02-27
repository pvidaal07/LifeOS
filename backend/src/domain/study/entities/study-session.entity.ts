import { AggregateRoot } from '../../common';
import { SessionType } from '../value-objects/session-type.vo';

export interface StudySessionProps {
  id: string;
  userId: string;
  topicId: string;
  sessionType: SessionType;
  durationMinutes: number | null;
  qualityRating: number | null;
  notes: string | null;
  studiedAt: Date;
  createdAt: Date;
}

export class StudySession extends AggregateRoot {
  private _userId: string;
  private _topicId: string;
  private _sessionType: SessionType;
  private _durationMinutes: number | null;
  private _qualityRating: number | null;
  private _notes: string | null;
  private _studiedAt: Date;

  private constructor(props: StudySessionProps) {
    super(props.id, props.createdAt, props.createdAt); // sessions don't have updatedAt
    this._userId = props.userId;
    this._topicId = props.topicId;
    this._sessionType = props.sessionType;
    this._durationMinutes = props.durationMinutes;
    this._qualityRating = props.qualityRating;
    this._notes = props.notes;
    this._studiedAt = props.studiedAt;
  }

  get userId(): string {
    return this._userId;
  }

  get topicId(): string {
    return this._topicId;
  }

  get sessionType(): SessionType {
    return this._sessionType;
  }

  get durationMinutes(): number | null {
    return this._durationMinutes;
  }

  get qualityRating(): number | null {
    return this._qualityRating;
  }

  get notes(): string | null {
    return this._notes;
  }

  get studiedAt(): Date {
    return this._studiedAt;
  }

  static create(params: {
    id: string;
    userId: string;
    topicId: string;
    sessionType: SessionType;
    durationMinutes?: number | null;
    qualityRating?: number | null;
    notes?: string | null;
    studiedAt?: Date;
  }): StudySession {
    const now = new Date();
    return new StudySession({
      id: params.id,
      userId: params.userId,
      topicId: params.topicId,
      sessionType: params.sessionType,
      durationMinutes: params.durationMinutes ?? null,
      qualityRating: params.qualityRating ?? null,
      notes: params.notes ?? null,
      studiedAt: params.studiedAt ?? now,
      createdAt: now,
    });
  }

  static fromPersistence(props: StudySessionProps): StudySession {
    return new StudySession(props);
  }
}
