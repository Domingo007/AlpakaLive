import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import { BLOOD_NORMS, evaluateMarker, getStatusIcon, getStatusColor } from '@/lib/blood-norms';
import { useI18n } from '@/lib/i18n';

const MARKERS_TO_SHOW = [
  'wbc', 'neutrophils', 'hgb', 'plt', 'albumin', 'crp',
  'creatinine', 'alt', 'ast', 'glucose', 'potassium', 'calcium',
  'ca153', 'cea',
];

export function BloodEntryForm() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  function updateValue(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    const markers: Record<string, number> = {};
    for (const [key, val] of Object.entries(values)) {
      const num = parseFloat(val);
      if (!isNaN(num)) markers[key] = num;
    }
    if (Object.keys(markers).length === 0) return;

    await db.blood.put({
      id: uuidv4(), date, source: 'manual', markers, notes: '',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card title={t.bloodEntry.title}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.bloodEntry.testDate}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_60px_80px_40px] gap-1 text-[9px] text-text-secondary font-medium px-1">
            <div>{t.bloodEntry.marker}</div>
            <div className="text-center">{t.bloodEntry.result}</div>
            <div className="text-center">{t.bloodEntry.referenceRange}</div>
            <div className="text-center">{t.bloodEntry.status}</div>
          </div>

          {MARKERS_TO_SHOW.map(key => {
            const norm = BLOOD_NORMS[key];
            if (!norm) return null;
            const val = values[key] || '';
            const numVal = parseFloat(val);
            const status = !isNaN(numVal) ? evaluateMarker(key, numVal) : null;

            return (
              <div key={key} className="grid grid-cols-[1fr_60px_80px_40px] gap-1 items-center py-0.5">
                <div className="text-[10px]">
                  <span className="font-medium">{norm.shortName}</span>
                  <span className="text-text-secondary ml-1">({norm.unit})</span>
                </div>
                <input
                  type="number" step="0.1" value={val}
                  onChange={e => updateValue(key, e.target.value)}
                  className="rounded border border-border px-1 py-1 text-[11px] bg-bg-primary text-center w-full"
                />
                <div className="text-[9px] text-text-secondary text-center">
                  {norm.normalMin}–{norm.normalMax}
                </div>
                <div className="text-center text-sm">
                  {status ? (
                    <span title={status} style={{ color: getStatusColor(status) }}>
                      {getStatusIcon(status)}
                    </span>
                  ) : '—'}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={Object.values(values).every(v => !v)}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
          {saved ? t.common.saved : t.bloodEntry.saveResults}
        </button>

        <p className="text-[9px] text-text-secondary text-center">
          {t.bloodEntry.referenceNote}
        </p>
      </div>
    </Card>
  );
}
