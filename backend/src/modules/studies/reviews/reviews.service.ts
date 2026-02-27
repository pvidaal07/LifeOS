import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CompleteReviewDto } from './dto/complete-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────
  // Obtener repasos pendientes (hoy + atrasados)
  // Ordenados por urgencia (más urgente primero)
  // ─────────────────────────────────────────────────
  async getPendingReviews(userId: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const reviews = await this.prisma.reviewSchedule.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledDate: { lte: today },
      },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                studyPlan: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { urgencyScore: 'desc' },
    });

    return reviews;
  }

  // ─────────────────────────────────────────────────
  // Completar un repaso y programar el siguiente
  // Este es el CORAZÓN del algoritmo de repasos
  // ─────────────────────────────────────────────────
  async completeReview(id: string, userId: string, dto: CompleteReviewDto) {
    const review = await this.prisma.reviewSchedule.findFirst({
      where: { id, userId, status: 'pending' },
    });

    if (!review) {
      throw new NotFoundException('Repaso no encontrado o ya completado');
    }

    // Obtener configuración de repasos del usuario
    const settings = await this.prisma.reviewSettings.findUnique({
      where: { userId },
    });

    const baseIntervals = (settings?.baseIntervals as number[]) || [1, 7, 30, 90];
    const multipliers = {
      perfect: settings?.perfectMultiplier || 2.5,
      good: settings?.goodMultiplier || 2.0,
      regular: settings?.regularMultiplier || 1.2,
    };
    const badReset = settings?.badReset ?? true;

    // ─── Calcular siguiente intervalo ────────────────
    let nextIntervalDays: number;

    if (dto.result === 'bad' && badReset) {
      // Resultado malo → volver al intervalo base (1 día)
      nextIntervalDays = baseIntervals[0] || 1;
    } else if (dto.result === 'bad') {
      // Si badReset está desactivado, reducir intervalo a la mitad
      nextIntervalDays = Math.max(1, Math.round(review.intervalDays / 2));
    } else {
      // Aplicar multiplicador según resultado
      const multiplier = multipliers[dto.result] || 1;
      nextIntervalDays = Math.round(review.intervalDays * multiplier);
    }

    // Límite máximo: 365 días
    nextIntervalDays = Math.min(nextIntervalDays, 365);

    // Calcular fecha del próximo repaso
    const nextScheduledDate = new Date();
    nextScheduledDate.setDate(nextScheduledDate.getDate() + nextIntervalDays);

    // ─── Transacción: completar + programar + actualizar ─
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) Marcar repaso actual como completado
      const completedReview = await tx.reviewSchedule.update({
        where: { id },
        data: {
          status: 'completed',
          completedDate: new Date(),
          result: dto.result,
        },
      });

      // 2) Registrar la sesión de estudio como repaso
      await tx.studySession.create({
        data: {
          userId,
          topicId: review.topicId,
          sessionType: 'review',
          durationMinutes: dto.durationMinutes,
          qualityRating: dto.qualityRating,
          notes: dto.notes,
        },
      });

      // 3) Programar siguiente repaso
      const nextReview = await tx.reviewSchedule.create({
        data: {
          userId,
          topicId: review.topicId,
          scheduledDate: nextScheduledDate,
          intervalDays: nextIntervalDays,
          reviewNumber: review.reviewNumber + 1,
          urgencyScore: 0,
        },
      });

      // 4) Actualizar nivel de dominio del sistema
      await this.updateSystemMastery(tx, review.topicId);

      return { completedReview, nextReview };
    });

    return result;
  }

  // ─────────────────────────────────────────────────
  // Saltar un repaso (se reprograma para mañana)
  // ─────────────────────────────────────────────────
  async skipReview(id: string, userId: string) {
    const review = await this.prisma.reviewSchedule.findFirst({
      where: { id, userId, status: 'pending' },
    });

    if (!review) {
      throw new NotFoundException('Repaso no encontrado');
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.$transaction(async (tx) => {
      // Marcar actual como saltado
      await tx.reviewSchedule.update({
        where: { id },
        data: { status: 'skipped' },
      });

      // Crear nuevo repaso para mañana con mismos parámetros
      return tx.reviewSchedule.create({
        data: {
          userId,
          topicId: review.topicId,
          scheduledDate: tomorrow,
          intervalDays: review.intervalDays,
          reviewNumber: review.reviewNumber,
          urgencyScore: 0,
        },
      });
    });
  }

  // ─────────────────────────────────────────────────
  // Programar primer repaso tras estudiar un tema
  // ─────────────────────────────────────────────────
  async scheduleFirstReview(userId: string, topicId: string) {
    const settings = await this.prisma.reviewSettings.findUnique({
      where: { userId },
    });

    const baseIntervals = (settings?.baseIntervals as number[]) || [1, 7, 30, 90];
    const firstInterval = baseIntervals[0] || 1;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + firstInterval);

    return this.prisma.reviewSchedule.create({
      data: {
        userId,
        topicId,
        scheduledDate,
        intervalDays: firstInterval,
        reviewNumber: 1,
        urgencyScore: 0,
      },
    });
  }

  // ─────────────────────────────────────────────────
  // Recalcular urgencia de todos los repasos pendientes
  // Fórmula: urgencia = (días_retraso + 1) / intervalo × (11 - dominio)
  // ─────────────────────────────────────────────────
  async recalculateUrgency(userId: string) {
    const pendingReviews = await this.prisma.reviewSchedule.findMany({
      where: { userId, status: 'pending' },
      include: { topic: true },
    });

    const today = new Date();

    const updates = pendingReviews.map((review) => {
      const scheduledDate = new Date(review.scheduledDate);
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      const masteryLevel = review.topic.masteryLevel || 1;
      const urgencyScore =
        ((daysOverdue + 1) / Math.max(1, review.intervalDays)) *
        (11 - masteryLevel);

      return this.prisma.reviewSchedule.update({
        where: { id: review.id },
        data: { urgencyScore },
      });
    });

    await this.prisma.$transaction(updates);
  }

  // ─────────────────────────────────────────────────
  // Actualizar nivel de dominio calculado por el sistema
  // system_mastery = min(10, (exitosos/total) × 10 × log₂(intervalo+1) / 3)
  // ─────────────────────────────────────────────────
  private async updateSystemMastery(tx: any, topicId: string) {
    const reviews = await tx.reviewSchedule.findMany({
      where: { topicId, status: 'completed' },
      orderBy: { completedDate: 'asc' },
    });

    if (reviews.length === 0) return;

    const successfulReviews = reviews.filter(
      (r: any) => r.result === 'perfect' || r.result === 'good',
    ).length;

    const lastReview = reviews[reviews.length - 1];
    const intervalFactor =
      Math.log2((lastReview?.intervalDays || 1) + 1) / 3;

    const systemMastery = Math.min(
      10,
      (successfulReviews / reviews.length) * 10 * intervalFactor,
    );

    await tx.topic.update({
      where: { id: topicId },
      data: {
        systemMasteryLevel: Math.round(systemMastery * 10) / 10,
        status: systemMastery >= 8 ? 'mastered' : 'in_progress',
      },
    });
  }
}
