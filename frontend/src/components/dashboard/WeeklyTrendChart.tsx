import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { WeeklyTrendItem } from '../../types';

interface WeeklyTrendChartProps {
  data: WeeklyTrendItem[];
}

const DAY_NAMES_ES: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
  return DAY_NAMES_ES[date.getDay()] ?? '';
}

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    dayLabel: formatDayLabel(item.date),
  }));

  const maxMinutes = Math.max(...data.map((d) => d.totalMinutes), 1);
  const hasData = data.some((d) => d.totalMinutes > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Minutos de estudio (7 días)</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted text-sm text-muted-foreground">
            Sin actividad esta semana
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 32% 91%)" />
              <XAxis
                dataKey="dayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(215 16% 47%)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
                domain={[0, Math.ceil(maxMinutes * 1.2)]}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [`${value} min`, 'Estudio']}
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(214 32% 91%)',
                  fontSize: 13,
                }}
              />
              <Bar
                dataKey="totalMinutes"
                fill="hsl(221 83% 53%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
