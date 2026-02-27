import { Subject } from '../../domain/study';

export interface SubjectRepositoryPort {
  findAllByPlanId(planId: string, userId: string): Promise<SubjectWithTopics[]>;
  findByIdWithOwnership(id: string, userId: string): Promise<SubjectWithDetails | null>;
  verifyPlanOwnership(planId: string, userId: string): Promise<boolean>;
  save(subject: Subject): Promise<Subject>;
  update(subject: Subject): Promise<Subject>;
  delete(id: string): Promise<void>;
}

export interface SubjectWithTopics {
  subject: Subject;
  topics: TopicSummary[];
}

export interface SubjectWithDetails {
  subject: Subject;
  planName: string;
  planUserId: string;
  topics: TopicSummary[];
}

export interface TopicSummary {
  id: string;
  name: string;
  status: string;
  masteryLevel: number;
  systemMasteryLevel: number;
  displayOrder: number;
}
