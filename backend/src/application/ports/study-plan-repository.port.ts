import { StudyPlan } from '../../domain/study';

export interface StudyPlanRepositoryPort {
  findAllByUserId(userId: string): Promise<StudyPlanWithSubjects[]>;
  findByIdAndUserId(id: string, userId: string): Promise<StudyPlanWithFullDetails | null>;
  save(plan: StudyPlan): Promise<StudyPlan>;
  update(plan: StudyPlan): Promise<StudyPlan>;
  delete(id: string, userId: string): Promise<StudyPlan>;
}

/** For findAll: plan + subjects with _count.topics */
export interface StudyPlanWithSubjects {
  plan: StudyPlan;
  subjects: SubjectSummary[];
}

export interface SubjectSummary {
  id: string;
  studyPlanId: string;
  name: string;
  description: string | null;
  color: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { topics: number };
}

/** For findOne: plan + subjects with nested topics */
export interface StudyPlanWithFullDetails {
  plan: StudyPlan;
  subjects: SubjectWithTopicsList[];
}

export interface SubjectWithTopicsList {
  id: string;
  studyPlanId: string;
  name: string;
  description: string | null;
  color: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  topics: TopicBasic[];
}

export interface TopicBasic {
  id: string;
  subjectId: string;
  name: string;
  description: string | null;
  masteryLevel: number;
  systemMasteryLevel: number;
  status: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
