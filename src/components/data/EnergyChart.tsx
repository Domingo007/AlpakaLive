import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useI18n } from '@/lib/i18n';
import type { DailyLog } from '@/types';

interface EnergyChartProps {
  data: DailyLog[];
}

export function EnergyChart({ data }: EnergyChartProps) {
  const { t } = useI18n();

  const chartData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date.slice(5),
      [t.charts.energy]: d.energy,
      [t.charts.mood]: d.mood,
      [t.charts.pain]: d.pain,
      [t.charts.nausea]: d.nausea,
    }));

  if (chartData.length === 0) {
    return <div className="text-center text-text-secondary text-xs py-4">{t.charts.noData}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line type="monotone" dataKey={t.charts.energy} stroke="#7d9a6e" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey={t.charts.mood} stroke="#3498db" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey={t.charts.pain} stroke="#e74c3c" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey={t.charts.nausea} stroke="#f39c12" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}
