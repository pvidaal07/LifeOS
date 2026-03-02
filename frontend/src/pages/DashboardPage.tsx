import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studiesApi } from '../api/studies.api';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import {
  GreetingWidget,
  WeeklyTrendChart,
  StreakWidget,
  SubjectProgressWidget,
  UpcomingReviewsWidget,
  WelcomeCard,
} from '../components/dashboard';
import { useOnboardingStore } from '../stores/onboarding.store';
import type { DashboardData, StudyPlan } from '../types';

const SUBJECT_COLOR_FALLBACK = 'hsl(var(--color-primary-500))';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await studiesApi.getDashboard();
      return res.data.data as DashboardData;
    },
  });

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['study-plans'],
    queryFn: async () => {
      const res = await studiesApi.getPlans();
      return res.data.data as StudyPlan[];
    },
  });

  const welcomeCardDismissed = useOnboardingStore((s) => s.welcomeCardDismissed);
  const dismissWelcomeCard = useOnboardingStore((s) => s.dismissWelcomeCard);

  const plansCount = plans?.length ?? 0;
  const showWelcomeCard =
    !isLoading && !isLoadingPlans && plansCount === 0 && !welcomeCardDismissed;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <GreetingWidget
        pendingReviewCount={data?.reviews.count ?? 0}
        sessionsToday={data?.today.sessionsCompleted ?? 0}
      />

      {/* Onboarding: WelcomeCard for new users */}
      {showWelcomeCard && <WelcomeCard onDismiss={dismissWelcomeCard} />}

      {/* Stats + Streak row */}
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold">Estadísticas</h2>
        <HelpTooltip
          content="Resumen de tu actividad de estudio: repasos que necesitan atención, sesiones completadas y tiempo dedicado esta semana. Mantén la racha diaria para formar hábito."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Repasos pendientes"
          value={data?.reviews.count ?? 0}
          state={data?.reviews.count ? 'warning' : 'neutral'}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Sesiones hoy"
          value={data?.today.sessionsCompleted ?? 0}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Sesiones esta semana"
          value={data?.week.sessionsCompleted ?? 0}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Minutos esta semana"
          value={data?.week.totalMinutes ?? 0}
        />
        <StreakWidget
          streak={data?.streak ?? { currentStreak: 0, studiedToday: false }}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        <WeeklyTrendChart data={data?.weeklyTrend ?? []} />
        <SubjectProgressWidget data={data?.subjectProgress ?? []} />
      </div>

      {/* Two-column: Pending reviews + Upcoming reviews */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending reviews */}
        <section>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Repasos pendientes</CardTitle>
              {(data?.reviews.count ?? 0) > 0 && (
                <Link
                  to="/studies/reviews"
                  className="text-sm font-medium text-primary transition-colors hover:text-brand-primary-700"
                >
                  Ir a repasos
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {data?.reviews.pending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted-foreground">
                  No tienes repasos pendientes. Buen trabajo.
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.reviews.pending.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-muted sm:flex-nowrap"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: review.topic?.subject?.color ?? SUBJECT_COLOR_FALLBACK }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{review.topic?.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {review.topic?.subject?.name} - Repaso #{review.reviewNumber}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={getUrgencyVariant(review.urgencyScore)}
                        className="shrink-0"
                      >
                        Urgencia {getUrgencyLabel(review.urgencyScore)} ({review.urgencyScore.toFixed(1)})
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Upcoming reviews */}
        <section>
          <UpcomingReviewsWidget reviews={data?.upcoming ?? []} />
        </section>
      </div>

      {/* Recent activity */}
      <section>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted-foreground">
                Aun no hay actividad. Empieza a estudiar.
              </div>
            ) : (
              <div className="space-y-2">
                {data?.recentActivity.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3 sm:flex-nowrap"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: session.topic?.subject?.color ?? SUBJECT_COLOR_FALLBACK }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm">{session.topic?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {session.sessionType === 'first_time'
                            ? 'Primera vez'
                            : session.sessionType === 'review'
                              ? 'Repaso'
                              : 'Practica'}
                          {session.durationMinutes && ` - ${session.durationMinutes} min`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.studiedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function getUrgencyVariant(score: number): 'danger' | 'warning' | 'success' {
  if (score >= 7) return 'danger';
  if (score >= 4) return 'warning';
  return 'success';
}

function getUrgencyLabel(score: number): 'alta' | 'media' | 'baja' {
  if (score >= 7) return 'alta';
  if (score >= 4) return 'media';
  return 'baja';
}

function StatCard({
  icon,
  label,
  value,
  state = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  state?: 'neutral' | 'warning';
}) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p
          className={`text-2xl font-bold ${
            state === 'warning' ? 'text-state-warning-foreground' : 'text-text-primary'
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
