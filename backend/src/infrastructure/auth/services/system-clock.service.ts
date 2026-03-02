import { Injectable } from '@nestjs/common';
import type { ClockPort } from '../../../application/ports';

@Injectable()
export class SystemClockService implements ClockPort {
  now(): Date {
    return new Date();
  }
}
