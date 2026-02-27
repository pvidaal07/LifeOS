import { ValueObject } from '../../common';

export class QualityRating extends ValueObject<number> {
  static create(value: number): QualityRating {
    return new QualityRating(value);
  }

  protected validate(value: number): void {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(
        `Quality rating debe ser un entero entre 1 y 5, recibido: ${value}`,
      );
    }
  }
}
