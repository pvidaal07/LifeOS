import { Subject } from '../../domain/study';

export interface SubjectRepositoryPort {
  findAllByPlanId(planId: string, userId: string): Promise<SubjectWithRelations[]>;
  findByIdWithOwnership(id: string, userId: string): Promise<SubjectWithFullDetails | null>;
  verifyPlanOwnership(planId: string, userId: string): Promise<boolean>;
  save(subject: Subject): Promise<Subject>;
  update(subject: Subject): Promise<Subject>;
  delete(id: string): Promise<Subject>;
}

/** For findAll: subject + _count.topics + topics list */
export interface SubjectWithRelations {
  subject: Subject;
  _count: { topics: number };
  topics: TopicSummary[];
}

/** For findOne: subject + studyPlan + topics */
export interface SubjectWithFullDetails {
  subject: Subject;
  studyPlan: { userId: string; name: string };
  topics: TopicSummary[];
}

export interface TopicSummary {
  id: string;
  subjectId: string;
  name: string;
  description: string | null;
  status: string;
  masteryLevel: number;
  systemMasteryLevel: number;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
