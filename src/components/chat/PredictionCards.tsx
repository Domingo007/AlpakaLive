import type { PredictionResult, DayPrediction } from '@/lib/prediction-engine';
import { getPhaseColor } from '@/lib/phase-calculator';

interface PredictionCardsProps {
  result: PredictionResult;
}

export function PredictionCards({ result }: PredictionCardsProps) {
  if (result.insufficientData) {
    return (
      <div className="bg-accent-warm/30 rounded-xl p-4 text-sm space-y-2">
        <div className="font-medium">Predykcja niedostępna</div>
        <p className="text-xs text-text-secondary">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Predykcja 5 dni</span>
        <ConfidenceBadge confidence={result.overallConfidence} />
      </div>
      <div className="text-[10px] text-text-secondary">
        Na podstawie: {result.basedOn.join(', ')}
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {result.days.map(day => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>

      {/* Patterns */}
      {result.patterns.length > 0 && (
        <div className="bg-bg-primary rounded-lg p-3 space-y-1">
          <div className="text-xs font-medium text-accent-dark">Wykryte wzorce</div>
          {result.patterns.map((p, i) => (
            <div key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5" style={{ opacity: p.strength }}>●</span>
              <span>{p.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Risks */}
      {result.risks.length > 0 && (
        <div className="bg-alert-critical/5 border border-alert-critical/20 rounded-lg p-3 space-y-1">
          <div className="text-xs font-medium text-alert-critical">⚠️ Ryzyka</div>
          {result.risks.map((r, i) => (
            <div key={i} className="text-[11px] text-alert-critical/80">• {r}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DayCard({ day }: { day: DayPrediction }) {
  const phaseColor = getPhaseColor(day.phase);
  const isToday = day.date === new Date().toISOString().split('T')[0];

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 ${
        isToday ? 'border-accent-dark bg-bg-card shadow-sm' : 'border-border bg-bg-card/50'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: phaseColor }}
          />
          <div>
            <span className="text-xs font-medium capitalize">{day.dayOfWeek}</span>
            <span className="text-[10px] text-text-secondary ml-1.5">{day.date.slice(5)}</span>
            {isToday && <span className="text-[9px] bg-accent-dark text-accent-warm px-1.5 py-0.5 rounded-full ml-1.5">dziś</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-text-secondary">dzień {day.dayInCycle} cyklu</div>
          <div className="text-[10px] font-medium" style={{ color: phaseColor }}>
            {day.phaseLabel}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricBar label="Energia" value={day.energy.predicted} min={day.energy.min} max={day.energy.max} color="#7d9a6e" inverted={false} />
        <MetricBar label="Ból" value={day.pain.predicted} min={day.pain.min} max={day.pain.max} color="#e74c3c" inverted={true} />
        <MetricBar label="Nudności" value={day.nausea.predicted} min={day.nausea.min} max={day.nausea.max} color="#f39c12" inverted={true} />
      </div>

      {/* Recommendations */}
      {day.recommendations.length > 0 && (
        <div className="space-y-0.5">
          {day.recommendations.map((rec, i) => (
            <div key={i} className="text-[10px] text-text-secondary flex items-start gap-1">
              <span className="material-symbols-rounded text-lavender-500 shrink-0" style={{fontSize:14}}>lightbulb</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-1">
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-dark transition-all"
            style={{ width: `${day.confidence * 100}%` }}
          />
        </div>
        <span className="text-[9px] text-text-secondary">{Math.round(day.confidence * 100)}%</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, min, max, color, inverted }: {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  inverted: boolean;
}) {
  // For inverted metrics (pain, nausea), lower is better
  const fillPercent = (value / 10) * 100;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-text-secondary">{label}</span>
        <span className="text-[10px] font-medium" style={{ color }}>
          {value}/10
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden relative">
        {/* Range indicator */}
        <div
          className="absolute h-full opacity-20 rounded-full"
          style={{
            backgroundColor: color,
            left: `${(min / 10) * 100}%`,
            width: `${((max - min) / 10) * 100}%`,
          }}
        />
        {/* Value indicator */}
        <div
          className="h-full rounded-full transition-all"
          style={{ backgroundColor: color, width: `${fillPercent}%` }}
        />
      </div>
      <div className="text-[8px] text-text-secondary text-center">
        {min}–{max}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const label = pct >= 70 ? 'wysoka' : pct >= 40 ? 'średnia' : 'niska';
  const color = pct >= 70 ? '#27ae60' : pct >= 40 ? '#f39c12' : '#e74c3c';

  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color, backgroundColor: `${color}15` }}>
      {label} ({pct}%)
    </span>
  );
}

// ==================== ACCURACY DISPLAY ====================

export function AccuracyCard({ accuracy, predictions }: {
  accuracy: number;
  predictions: { targetDate: string; prediction: string; actual?: string; accuracy?: number; match: boolean }[];
}) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Trafność predykcji</span>
        <span className="text-sm font-bold" style={{ color: accuracy >= 70 ? '#27ae60' : accuracy >= 50 ? '#f39c12' : '#e74c3c' }}>
          {accuracy}%
        </span>
      </div>
      <div className="space-y-1">
        {predictions.slice(0, 5).map((p, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="text-text-secondary">{p.targetDate.slice(5)}</span>
            <span>{p.match ? '✅' : '❌'} {p.accuracy}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
