import { EntityNotFoundError } from '../../common';

export class StudyPlanNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Plan de estudio', id);
  }
}

export class SubjectNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Asignatura', id);
  }
}

export class TopicNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Tema', id);
  }
}

export class StudySessionNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Sesión de estudio', id);
  }
}
