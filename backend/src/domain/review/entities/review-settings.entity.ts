import { Entity } from '../../common';

export interface ReviewSettingsProps {
  id: string;
  userId: string;
  baseIntervals: number[];
  perfectMultiplier: number;
  goodMultiplier: number;
  regularMultiplier: number;
  badReset: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSettings extends Entity {
  private _userId: string;
  private _baseIntervals: number[];
  private _perfectMultiplier: number;
  private _goodMultiplier: number;
  private _regularMultiplier: number;
  private _badReset: boolean;

  private constructor(props: ReviewSettingsProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._userId = props.userId;
    this._baseIntervals = [...props.baseIntervals];
    this._perfectMultiplier = props.perfectMultiplier;
    this._goodMultiplier = props.goodMultiplier;
    this._regularMultiplier = props.regularMultiplier;
    this._badReset = props.badReset;
  }

  get userId(): string {
    return this._userId;
  }

  get baseIntervals(): readonly number[] {
    return this._baseIntervals;
  }

  get perfectMultiplier(): number {
    return this._perfectMultiplier;
  }

  get goodMultiplier(): number {
    return this._goodMultiplier;
  }

  get regularMultiplier(): number {
    return this._regularMultiplier;
  }

  get badReset(): boolean {
    return this._badReset;
  }

  static fromPersistence(props: ReviewSettingsProps): ReviewSettings {
    return new ReviewSettings(props);
  }

  static createDefault(id: string, userId: string): ReviewSettings {
    const now = new Date();
    return new ReviewSettings({
      id,
      userId,
      baseIntervals: [1, 7, 30, 90],
      perfectMultiplier: 2.5,
      goodMultiplier: 2.0,
      regularMultiplier: 1.2,
      badReset: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: {
    baseIntervals?: number[];
    perfectMultiplier?: number;
    goodMultiplier?: number;
    regularMultiplier?: number;
    badReset?: boolean;
  }): void {
    if (params.baseIntervals !== undefined) this._baseIntervals = [...params.baseIntervals];
    if (params.perfectMultiplier !== undefined) this._perfectMultiplier = params.perfectMultiplier;
    if (params.goodMultiplier !== undefined) this._goodMultiplier = params.goodMultiplier;
    if (params.regularMultiplier !== undefined) this._regularMultiplier = params.regularMultiplier;
    if (params.badReset !== undefined) this._badReset = params.badReset;
    this._updatedAt = new Date();
  }

  getMultiplierForResult(result: string): number {
    switch (result) {
      case 'perfect':
        return this._perfectMultiplier;
      case 'good':
        return this._goodMultiplier;
      case 'regular':
        return this._regularMultiplier;
      default:
        return 1;
    }
  }

  getFirstInterval(): number {
    return this._baseIntervals[0] ?? 1;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      baseIntervals: [...this._baseIntervals],
      perfectMultiplier: this.perfectMultiplier,
      goodMultiplier: this.goodMultiplier,
      regularMultiplier: this.regularMultiplier,
      badReset: this.badReset,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
