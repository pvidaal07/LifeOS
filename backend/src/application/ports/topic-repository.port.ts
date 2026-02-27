import { Topic } from '../../domain/study';

export interface TopicRepositoryPort {
  findAllBySubjectId(subjectId: string, userId: string): Promise<Topic[]>;
  findByIdWithOwnership(id: string, userId: string): Promise<TopicWithFullDetails | null>;
  verifySubjectOwnership(subjectId: string, userId: string): Promise<boolean>;
  save(topic: Topic): Promise<Topic>;
  update(topic: Topic): Promise<Topic>;
  updateMastery(topicId: string, systemMasteryLevel: number, status: string): Promise<void>;
  delete(id: string): Promise<Topic>;
  countSessionsByTopicAndUser(topicId: string, userId: string): Promise<number>;
}

/** For findOne: topic + subject (with studyPlan) + sessions + reviews */
export interface TopicWithFullDetails {
  topic: Topic;
  subject: SubjectForTopic;
  studySessions: SessionRecord[];
  reviewSchedules: ReviewRecord[];
}

export interface SubjectForTopic {
  id: string;
  studyPlanId: string;
  name: string;
  description: string | null;
  color: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  studyPlan: { userId: string; name: string };
}

export interface SessionRecord {
  id: string;
  topicId: string;
  userId: string;
  sessionType: string;
  durationMinutes: number | null;
  qualityRating: number | null;
  notes: string | null;
  studiedAt: Date;
  createdAt: Date;
}

export interface ReviewRecord {
  id: string;
  topicId: string;
  userId: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: string;
  result: string | null;
  urgencyScore: number;
  intervalDays: number;
  reviewNumber: number;
  createdAt: Date;
  updatedAt: Date;
}
