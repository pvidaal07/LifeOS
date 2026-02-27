export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = value;
    this.validate(value);
  }

  get value(): T {
    return this._value;
  }

  equals(other: ValueObject<T>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }

  toJSON(): T {
    return this._value;
  }

  protected abstract validate(value: T): void;
}
