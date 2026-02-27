import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los datos del panel "Hoy"
   * Este es el centro de LifeOS: una vista rápida del día
   */
  async getDashboard(userId: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);

    // Ejecutar todas las consultas en paralelo
    const [
      pendingReviews,
      todaySessionsCount,
      weekStats,
      recentSessions,
      topicStats,
      upcomingReviews,
    ] = await Promise.all([
      // ─── Repasos pendientes (hoy + atrasados) ──────
      this.prisma.reviewSchedule.findMany({
        where: {
          userId,
          status: 'pending',
          scheduledDate: { lte: today },
        },
        include: {
          topic: {
            include: {
              subject: {
                select: { name: true, color: true },
              },
            },
          },
        },
        orderBy: { urgencyScore: 'desc' },
      }),

      // ─── Sesiones completadas hoy ──────────────────
      this.prisma.studySession.count({
        where: {
          userId,
          studiedAt: { gte: startOfToday },
        },
      }),

      // ─── Estadísticas de la semana ─────────────────
      this.prisma.studySession.aggregate({
        where: {
          userId,
          studiedAt: { gte: startOfWeek },
        },
        _count: true,
        _sum: { durationMinutes: true },
      }),

      // ─── Actividad reciente ────────────────────────
      this.prisma.studySession.findMany({
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
        take: 5,
      }),

      // ─── Estadísticas de temas ─────────────────────
      this.prisma.topic.groupBy({
        by: ['status'],
        where: {
          subject: {
            studyPlan: { userId },
          },
        },
        _count: true,
      }),

      // ─── Próximos repasos (siguiente semana) ───────
      this.prisma.reviewSchedule.findMany({
        where: {
          userId,
          status: 'pending',
          scheduledDate: {
            gt: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          topic: {
            select: { name: true },
          },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 10,
      }),
    ]);

    return {
      reviews: {
        pending: pendingReviews,
        count: pendingReviews.length,
      },
      today: {
        sessionsCompleted: todaySessionsCount,
      },
      week: {
        sessionsCompleted: weekStats._count,
        totalMinutes: weekStats._sum.durationMinutes || 0,
      },
      recentActivity: recentSessions,
      topicStats: topicStats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      upcoming: upcomingReviews,
    };
  }
}
