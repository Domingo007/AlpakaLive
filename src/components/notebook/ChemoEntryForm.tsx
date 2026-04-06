import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import { useI18n } from '@/lib/i18n';

export function ChemoEntryForm() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [drugs, setDrugs] = useState('');
  const [cycle, setCycle] = useState('1');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  async function handleSave() {
    if (!date) return;
    await db.chemo.put({
      id: uuidv4(),
      date,
      plannedDate: date,
      actualDate: date,
      status: 'completed',
      drugs: drugs.split(',').map(d => d.trim()).filter(Boolean),
      cycle: parseInt(cycle) || 1,
      notes,
      sideEffects: [],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card title={t.chemoEntry.title}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.common.date}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.chemoEntry.regimenDrugs}</label>
          <input value={drugs} onChange={e => setDrugs(e.target.value)}
            placeholder={t.chemoEntry.regimenPlaceholder}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.chemoEntry.cycleNumber}</label>
          <input type="number" value={cycle} onChange={e => setCycle(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.common.notes}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={t.chemoEntry.notesPlaceholder}
            rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary resize-y" />
        </div>

        <p className="text-[10px] text-text-secondary">
          {t.chemoEntry.phaseNote}
        </p>

        <button onClick={handleSave} disabled={!date}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
          {saved ? t.common.saved : t.chemoEntry.saveSession}
        </button>
      </div>
    </Card>
  );
}
