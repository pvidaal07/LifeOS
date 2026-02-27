import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private reviewsService: ReviewsService,
  ) {}

  /**
   * Registrar una sesión de estudio.
   * Si es la primera vez que se estudia el tema, programa el primer repaso automáticamente.
   */
  async create(userId: string, dto: CreateSessionDto) {
    // Verificar si es la primera vez que se estudia este tema
    const existingSessions = await this.prisma.studySession.count({
      where: { userId, topicId: dto.topicId },
    });

    const isFirstTime = existingSessions === 0;
    const sessionType = isFirstTime
      ? 'first_time'
      : dto.sessionType || 'practice';

    // Crear la sesión de estudio
    const session = await this.prisma.studySession.create({
      data: {
        userId,
        topicId: dto.topicId,
        sessionType,
        durationMinutes: dto.durationMinutes,
        qualityRating: dto.qualityRating,
        notes: dto.notes,
      },
      include: {
        topic: {
          include: {
            subject: { select: { name: true, color: true } },
          },
        },
      },
    });

    // Si es la primera vez, programar primer repaso y actualizar estado del tema
    if (isFirstTime) {
      await this.reviewsService.scheduleFirstReview(userId, dto.topicId);

      await this.prisma.topic.update({
        where: { id: dto.topicId },
        data: { status: 'in_progress' },
      });
    }

    return session;
  }

  /**
   * Obtener sesiones de un tema específico
   */
  async findByTopic(topicId: string, userId: string) {
    return this.prisma.studySession.findMany({
      where: { topicId, userId },
      orderBy: { studiedAt: 'desc' },
    });
  }

  /**
   * Obtener sesiones recientes del usuario
   */
  async findRecent(userId: string, limit: number = 10) {
    return this.prisma.studySession.findMany({
      where: { userId },
      include: {
        topic: {
          include: {
            subject: {
              select: { name: true, color: true },
            },
          },
        },
      },
      orderBy: { studiedAt: 'desc' },
      take: limit,
    });
  }
}
