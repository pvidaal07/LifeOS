import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewScheduleMapper } from '../mappers/review-schedule.mapper';
import { StudySessionMapper } from '../mappers/study-session.mapper';
import {
  DashboardRepositoryPort,
  DashboardData,
  TopicStats,
  UpcomingReview,
} from '../../../application/ports/dashboard-repository.port';

@Injectable()
export class DashboardPrismaRepository implements DashboardRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string): Promise<DashboardData> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      pendingReviewsRaw,
      todaySessionsCount,
      weekStats,
      recentSessionsRaw,
      topicStatsRaw,
      upcomingReviewsRaw,
    ] = await Promise.all([
      // Pending reviews (today + overdue)
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
                include: {
                  studyPlan: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { urgencyScore: 'desc' },
      }),

      // Sessions completed today
      this.prisma.studySession.count({
        where: {
          userId,
          studiedAt: { gte: startOfToday },
        },
      }),

      // Week statistics
      this.prisma.studySession.aggregate({
        where: {
          userId,
          studiedAt: { gte: startOfWeek },
        },
        _count: true,
        _sum: { durationMinutes: true },
      }),

      // Recent activity
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

      // Topic stats by status
      this.prisma.topic.groupBy({
        by: ['status'],
        where: {
          subject: {
            studyPlan: { userId },
          },
        },
        _count: true,
      }),

      // Upcoming reviews (next week)
      this.prisma.reviewSchedule.findMany({
        where: {
          userId,
          status: 'pending',
          scheduledDate: {
            gt: today,
            lte: nextWeek,
          },
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
        orderBy: { scheduledDate: 'asc' },
        take: 10,
      }),
    ]);

    // Map pending reviews to domain + read-model
    const pendingReviews = pendingReviewsRaw.map((r) => ({
      review: ReviewScheduleMapper.toDomain(r),
      topicName: r.topic.name,
      subjectName: r.topic.subject.name,
      subjectColor: r.topic.subject.color,
      planName: r.topic.subject.studyPlan.name,
    }));

    // Map recent sessions to domain + read-model
    const recentActivity = recentSessionsRaw.map((s) => ({
      session: StudySessionMapper.toDomain(s),
      topicName: s.topic.name,
      subjectName: s.topic.subject.name,
      subjectColor: s.topic.subject.color,
    }));

    // Aggregate topic stats
    const topicStats: TopicStats = {
      not_started: 0,
      in_progress: 0,
      mastered: 0,
    };
    for (const stat of topicStatsRaw) {
      if (stat.status in topicStats) {
        topicStats[stat.status as keyof TopicStats] = stat._count;
      }
    }

    // Map upcoming reviews
    const upcomingReviews: UpcomingReview[] = upcomingReviewsRaw.map((r) => ({
      id: r.id,
      scheduledDate: r.scheduledDate,
      topicName: r.topic.name,
      subjectName: r.topic.subject.name,
      subjectColor: r.topic.subject.color,
    }));

    return {
      pendingReviews,
      pendingReviewCount: pendingReviews.length,
      todaySessionsCompleted: todaySessionsCount,
      weekStats: {
        sessionsCompleted: weekStats._count,
        totalMinutes: weekStats._sum.durationMinutes || 0,
      },
      recentActivity,
      topicStats,
      upcomingReviews,
    };
  }
}
