import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewScheduleMapper } from '../mappers/review-schedule.mapper';
import { StudySessionMapper } from '../mappers/study-session.mapper';
import {
  DashboardRepositoryPort,
  DashboardData,
  TopicStats,
  UpcomingReview,
  WeeklyTrendItem,
  StreakData,
  SubjectProgressItem,
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

    // 7 days ago at midnight for weekly trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      pendingReviewsRaw,
      todaySessionsCount,
      weekStats,
      recentSessionsRaw,
      topicStatsRaw,
      upcomingReviewsRaw,
      weeklyTrendRaw,
      streakDatesRaw,
      subjectProgressRaw,
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

      // Weekly trend: daily minutes for last 7 days
      this.prisma.$queryRaw<
        Array<{ date: Date; total_minutes: bigint; session_count: bigint }>
      >`
        SELECT DATE(studied_at) as date,
               COALESCE(SUM(duration_minutes), 0) as total_minutes,
               COUNT(*)::bigint as session_count
        FROM study_sessions
        WHERE user_id = ${userId}
          AND studied_at >= ${sevenDaysAgo}
        GROUP BY DATE(studied_at)
        ORDER BY date ASC
      `,

      // Streak: distinct study dates, walking backward
      this.prisma.$queryRaw<
        Array<{ study_date: Date }>
      >`
        SELECT DISTINCT DATE(studied_at) as study_date
        FROM study_sessions
        WHERE user_id = ${userId}
        ORDER BY study_date DESC
        LIMIT 365
      `,

      // Subject progress: topic counts by status per subject
      this.prisma.subject.findMany({
        where: {
          studyPlan: { userId },
        },
        select: {
          id: true,
          name: true,
          color: true,
          topics: {
            select: { status: true },
          },
        },
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

    // Build weekly trend with gap-filling for missing days
    const weeklyTrend = this.buildWeeklyTrend(weeklyTrendRaw, sevenDaysAgo);

    // Compute streak from distinct study dates
    const streak = this.computeStreak(streakDatesRaw);

    // Compute subject progress
    const subjectProgress = this.computeSubjectProgress(subjectProgressRaw);

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
      weeklyTrend,
      streak,
      subjectProgress,
    };
  }

  /**
   * Fill in missing days with zeros to ensure exactly 7 entries.
   */
  private buildWeeklyTrend(
    rawData: Array<{ date: Date; total_minutes: bigint; session_count: bigint }>,
    startDate: Date,
  ): WeeklyTrendItem[] {
    const dateMap = new Map<string, { totalMinutes: number; sessionCount: number }>();
    for (const row of rawData) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      dateMap.set(dateStr, {
        totalMinutes: Number(row.total_minutes),
        sessionCount: Number(row.session_count),
      });
    }

    const result: WeeklyTrendItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = dateMap.get(dateStr);
      result.push({
        date: dateStr,
        totalMinutes: entry?.totalMinutes ?? 0,
        sessionCount: entry?.sessionCount ?? 0,
      });
    }

    return result;
  }

  /**
   * Walk backward from today counting consecutive study days.
   */
  private computeStreak(
    rawDates: Array<{ study_date: Date }>,
  ): StreakData {
    if (rawDates.length === 0) {
      return { currentStreak: 0, studiedToday: false };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const studyDateStrings = rawDates.map(
      (r) => new Date(r.study_date).toISOString().split('T')[0],
    );

    const studiedToday = studyDateStrings.includes(todayStr);

    // Start counting from today (if studied) or yesterday
    let currentStreak = 0;
    const checkDate = new Date();
    if (!studiedToday) {
      // If not studied today, start checking from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const dateSet = new Set(studyDateStrings);

    for (let i = 0; i < 365; i++) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { currentStreak, studiedToday };
  }

  /**
   * Aggregate topic statuses per subject, filter out subjects with no topics.
   */
  private computeSubjectProgress(
    subjects: Array<{
      id: string;
      name: string;
      color: string;
      topics: Array<{ status: string }>;
    }>,
  ): SubjectProgressItem[] {
    return subjects
      .filter((s) => s.topics.length > 0)
      .map((s) => {
        const mastered = s.topics.filter((t) => t.status === 'mastered').length;
        const inProgress = s.topics.filter((t) => t.status === 'in_progress').length;
        const notStarted = s.topics.filter((t) => t.status === 'not_started').length;
        return {
          subjectId: s.id,
          subjectName: s.name,
          subjectColor: s.color,
          mastered,
          inProgress,
          notStarted,
          total: s.topics.length,
        };
      });
  }
}
