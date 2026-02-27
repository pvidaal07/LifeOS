import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.studyPlan.findMany({
      where: { userId },
      include: {
        subjects: {
          include: {
            _count: { select: { topics: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id, userId },
      include: {
        subjects: {
          include: {
            topics: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan de estudio no encontrado');
    }

    return plan;
  }

  async create(userId: string, dto: CreatePlanDto) {
    return this.prisma.studyPlan.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePlanDto) {
    await this.findOne(id, userId); // Verifica existencia y pertenencia
    return this.prisma.studyPlan.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.studyPlan.delete({
      where: { id },
    });
  }
}
