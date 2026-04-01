import { useDashboardData } from '@/hooks/useDatabase';
import { Card } from '@/components/shared/Card';
import { StatCard } from '@/components/shared/StatCard';
import { EnergyChart } from './EnergyChart';
import { BloodChart } from './BloodChart';

export function DataView() {
  const { daily, blood, wearable, counts, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        Ladowanie danych...
      </div>
    );
  }

  const hasData = Object.values(counts).some(c => c > 0);

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
      <h2 className="font-display text-lg font-semibold text-accent-dark">Dane i trendy</h2>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon="📝" label="Wpisy dziennika" value={counts.daily || 0} />
        <StatCard icon="🩸" label="Badania krwi" value={counts.blood || 0} />
        <StatCard icon="⌚" label="Dane z opaski" value={counts.wearable || 0} />
        <StatCard icon="🍽️" label="Posilki" value={counts.meals || 0} />
        <StatCard icon="💉" label="Sesje chemii" value={counts.chemo || 0} />
        <StatCard icon="🏥" label="Obrazowanie" value={counts.imaging || 0} />
      </div>

      {!hasData ? (
        <Card>
          <div className="text-center py-8 text-text-secondary text-sm">
            <div className="text-3xl mb-3">📊</div>
            <p>Brak danych do wyswietlenia.</p>
            <p className="mt-1">Zacznij od codziennych wpisow w zakladce Chat — wykresy pojawia sie automatycznie.</p>
          </div>
        </Card>
      ) : (
        <>
          {daily.length > 0 && (
            <Card title="Energia / Nastroj / Bol (14 dni)">
              <EnergyChart data={daily} />
            </Card>
          )}

          {blood.length > 0 && (
            <Card title="Markery krwi">
              <BloodChart data={blood} />
            </Card>
          )}

          {wearable.length > 0 && (
            <Card title="Dane z opaski">
              <div className="space-y-2">
                {wearable.slice(0, 5).map(w => (
                  <div key={w.id} className="flex justify-between text-xs border-b border-border pb-1">
                    <span>{w.date}</span>
                    <span>RHR: {w.rhr}</span>
                    <span>HRV: {w.hrv}</span>
                    <span>SpO2: {w.spo2}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
