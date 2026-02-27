import { Topic as PrismaTopic } from '@prisma/client';
import { Topic } from '../../../domain/study/entities/topic.entity';
import { TopicStatus } from '../../../domain/study/value-objects/topic-status.vo';

export class TopicMapper {
  static toDomain(prisma: PrismaTopic): Topic {
    return Topic.fromPersistence({
      id: prisma.id,
      subjectId: prisma.subjectId,
      name: prisma.name,
      description: prisma.description,
      masteryLevel: prisma.masteryLevel,
      systemMasteryLevel: prisma.systemMasteryLevel,
      status: TopicStatus.create(prisma.status),
      displayOrder: prisma.displayOrder,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: Topic): {
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
  } {
    return {
      id: domain.id,
      subjectId: domain.subjectId,
      name: domain.name,
      description: domain.description,
      masteryLevel: domain.masteryLevel,
      systemMasteryLevel: domain.systemMasteryLevel,
      status: domain.status.value,
      displayOrder: domain.displayOrder,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
