import { StudyPlan } from '../../domain/study';

export interface StudyPlanRepositoryPort {
  findAllByUserId(userId: string): Promise<StudyPlanWithCounts[]>;
  findByIdAndUserId(id: string, userId: string): Promise<StudyPlanWithDetails | null>;
  save(plan: StudyPlan): Promise<StudyPlan>;
  update(plan: StudyPlan): Promise<StudyPlan>;
  delete(id: string, userId: string): Promise<void>;
}

export interface StudyPlanWithCounts {
  plan: StudyPlan;
  subjectCount: number;
  topicCount: number;
}

export interface StudyPlanWithDetails {
  plan: StudyPlan;
  subjects: SubjectWithTopicCount[];
}

export interface SubjectWithTopicCount {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
  topicCount: number;
}
