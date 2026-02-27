import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async findBySubject(subjectId: string, userId: string) {
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.topic.findMany({
      where: { subjectId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const topic = await this.prisma.topic.findFirst({
      where: { id },
      include: {
        subject: {
          include: {
            studyPlan: { select: { userId: true, name: true } },
          },
        },
        studySessions: {
          orderBy: { studiedAt: 'desc' },
          take: 10,
        },
        reviewSchedules: {
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Tema no encontrado');
    }

    if (topic.subject.studyPlan.userId !== userId) {
      throw new ForbiddenException();
    }

    return topic;
  }

  async create(userId: string, dto: CreateTopicDto) {
    await this.verifySubjectOwnership(dto.subjectId, userId);

    return this.prisma.topic.create({
      data: {
        subjectId: dto.subjectId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateTopicDto) {
    await this.findOne(id, userId);
    return this.prisma.topic.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.topic.delete({
      where: { id },
    });
  }

  private async verifySubjectOwnership(subjectId: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId },
      include: {
        studyPlan: { select: { userId: true } },
      },
    });

    if (!subject || subject.studyPlan.userId !== userId) {
      throw new NotFoundException('Asignatura no encontrada');
    }

    return subject;
  }
}
