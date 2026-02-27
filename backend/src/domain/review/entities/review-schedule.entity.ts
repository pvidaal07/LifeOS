import { AggregateRoot, InvalidOperationError } from '../../common';
import { ReviewStatus } from '../value-objects/review-status.vo';
import { ReviewResult } from '../value-objects/review-result.vo';

export interface ReviewScheduleProps {
  id: string;
  userId: string;
  topicId: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: ReviewStatus;
  result: ReviewResult | null;
  urgencyScore: number;
  intervalDays: number;
  reviewNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSchedule extends AggregateRoot {
  private _userId: string;
  private _topicId: string;
  private _scheduledDate: Date;
  private _completedDate: Date | null;
  private _status: ReviewStatus;
  private _result: ReviewResult | null;
  private _urgencyScore: number;
  private _intervalDays: number;
  private _reviewNumber: number;

  private constructor(props: ReviewScheduleProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._userId = props.userId;
    this._topicId = props.topicId;
    this._scheduledDate = props.scheduledDate;
    this._completedDate = props.completedDate;
    this._status = props.status;
    this._result = props.result;
    this._urgencyScore = props.urgencyScore;
    this._intervalDays = props.intervalDays;
    this._reviewNumber = props.reviewNumber;
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get topicId(): string {
    return this._topicId;
  }

  get scheduledDate(): Date {
    return this._scheduledDate;
  }

  get completedDate(): Date | null {
    return this._completedDate;
  }

  get status(): ReviewStatus {
    return this._status;
  }

  get result(): ReviewResult | null {
    return this._result;
  }

  get urgencyScore(): number {
    return this._urgencyScore;
  }

  get intervalDays(): number {
    return this._intervalDays;
  }

  get reviewNumber(): number {
    return this._reviewNumber;
  }

  // Factory: reconstitute from persistence
  static fromPersistence(props: ReviewScheduleProps): ReviewSchedule {
    return new ReviewSchedule(props);
  }

  // Factory: create first review for a topic
  static scheduleFirst(params: {
    id: string;
    userId: string;
    topicId: string;
    scheduledDate: Date;
    intervalDays: number;
  }): ReviewSchedule {
    const now = new Date();
    return new ReviewSchedule({
      id: params.id,
      userId: params.userId,
      topicId: params.topicId,
      scheduledDate: params.scheduledDate,
      completedDate: null,
      status: ReviewStatus.PENDING,
      result: null,
      urgencyScore: 0,
      intervalDays: params.intervalDays,
      reviewNumber: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory: schedule next review after completing one
  static scheduleNext(params: {
    id: string;
    userId: string;
    topicId: string;
    scheduledDate: Date;
    intervalDays: number;
    reviewNumber: number;
  }): ReviewSchedule {
    const now = new Date();
    return new ReviewSchedule({
      id: params.id,
      userId: params.userId,
      topicId: params.topicId,
      scheduledDate: params.scheduledDate,
      completedDate: null,
      status: ReviewStatus.PENDING,
      result: null,
      urgencyScore: 0,
      intervalDays: params.intervalDays,
      reviewNumber: params.reviewNumber,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Complete the review with a result
  complete(result: ReviewResult, completedDate: Date): void {
    if (!this._status.canTransitionTo(ReviewStatus.COMPLETED)) {
      throw new InvalidOperationError(
        `No se puede completar una review con estado '${this._status.value}'`,
      );
    }
    this._status = ReviewStatus.COMPLETED;
    this._result = result;
    this._completedDate = completedDate;
    this._updatedAt = new Date();
  }

  // Skip the review
  skip(): void {
    if (!this._status.canTransitionTo(ReviewStatus.SKIPPED)) {
      throw new InvalidOperationError(
        `No se puede omitir una review con estado '${this._status.value}'`,
      );
    }
    this._status = ReviewStatus.SKIPPED;
    this._updatedAt = new Date();
  }

  // Update urgency score (calculated externally by SpacedRepetitionService)
  updateUrgencyScore(score: number): void {
    this._urgencyScore = score;
    this._updatedAt = new Date();
  }
}
