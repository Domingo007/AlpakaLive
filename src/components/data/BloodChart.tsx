import type { BloodWork } from '@/types';
import { BLOOD_NORMS, evaluateMarker, getStatusIcon } from '@/lib/blood-norms';

interface BloodChartProps {
  data: BloodWork[];
}

const KEY_MARKERS = ['wbc', 'hgb', 'plt', 'albumin', 'neutrophils'];

export function BloodChart({ data }: BloodChartProps) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return <div className="text-center text-text-secondary text-xs py-4">Brak badan krwi</div>;
  }

  return (
    <div className="space-y-3">
      {sorted.map(bloodWork => (
        <div key={bloodWork.id} className="border-b border-border pb-2">
          <div className="text-xs font-medium text-accent-dark mb-1">{bloodWork.date}</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(bloodWork.markers)
              .filter(([key]) => KEY_MARKERS.includes(key) || BLOOD_NORMS[key])
              .map(([key, value]) => {
                const norm = BLOOD_NORMS[key];
                const status = evaluateMarker(key, value);
                const icon = getStatusIcon(status);
                return (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <span>{icon}</span>
                    <span className="text-text-secondary">{norm?.shortName || key}:</span>
                    <span className="font-medium">{value}</span>
                    {norm && <span className="text-text-secondary text-[10px]">{norm.unit}</span>}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
