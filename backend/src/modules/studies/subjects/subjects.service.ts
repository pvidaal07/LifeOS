import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findByPlan(studyPlanId: string, userId: string) {
    // Verificar que el plan pertenece al usuario
    await this.verifyPlanOwnership(studyPlanId, userId);

    return this.prisma.subject.findMany({
      where: { studyPlanId },
      include: {
        _count: { select: { topics: true } },
        topics: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id },
      include: {
        studyPlan: { select: { userId: true, name: true } },
        topics: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Asignatura no encontrada');
    }

    if (subject.studyPlan.userId !== userId) {
      throw new ForbiddenException();
    }

    return subject;
  }

  async create(userId: string, dto: CreateSubjectDto) {
    await this.verifyPlanOwnership(dto.studyPlanId, userId);

    return this.prisma.subject.create({
      data: {
        studyPlanId: dto.studyPlanId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateSubjectDto) {
    await this.findOne(id, userId);
    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.subject.delete({
      where: { id },
    });
  }

  private async verifyPlanOwnership(planId: string, userId: string) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) {
      throw new NotFoundException('Plan de estudio no encontrado');
    }
    return plan;
  }
}
