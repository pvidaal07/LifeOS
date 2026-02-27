export abstract class Entity<T extends string = string> {
  constructor(
    protected readonly _id: T,
    protected readonly _createdAt: Date,
    protected _updatedAt: Date,
  ) {}

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  equals(other: Entity<T>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this._id === other._id;
  }
}
