import { Entity } from '../../common';

export interface UserModuleProps {
  id: string;
  userId: string;
  moduleKey: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}

export class UserModule extends Entity {
  private _userId: string;
  private _moduleKey: string;
  private _isActive: boolean;
  private _displayOrder: number;

  private constructor(props: UserModuleProps) {
    super(props.id, props.createdAt, props.createdAt); // no updatedAt in schema
    this._userId = props.userId;
    this._moduleKey = props.moduleKey;
    this._isActive = props.isActive;
    this._displayOrder = props.displayOrder;
  }

  get userId(): string {
    return this._userId;
  }

  get moduleKey(): string {
    return this._moduleKey;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  static create(params: {
    id: string;
    userId: string;
    moduleKey: string;
    isActive: boolean;
    displayOrder: number;
  }): UserModule {
    return new UserModule({
      ...params,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: UserModuleProps): UserModule {
    return new UserModule(props);
  }

  update(params: { isActive?: boolean; displayOrder?: number }): void {
    if (params.isActive !== undefined) this._isActive = params.isActive;
    if (params.displayOrder !== undefined) this._displayOrder = params.displayOrder;
  }
}
