import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';

export function ChemoEntryForm() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [drugs, setDrugs] = useState('');
  const [cycle, setCycle] = useState('1');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

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
    <Card title="💉 Dodaj sesję chemii">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Schemat (leki)</label>
          <input value={drugs} onChange={e => setDrugs(e.target.value)}
            placeholder="np. Paklitaksel, Gemcytabina"
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Cykl nr</label>
          <input type="number" value={cycle} onChange={e => setCycle(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Notatki</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Objawy, dawka, czas podania..."
            rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary resize-y" />
        </div>

        <p className="text-[10px] text-text-secondary">
          Fazy cyklu (A/B/C) obliczane automatycznie na podstawie daty. Widoczne w kalendarzu.
        </p>

        <button onClick={handleSave} disabled={!date}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
          {saved ? '✓ Zapisano!' : 'Zapisz sesję'}
        </button>
      </div>
    </Card>
  );
}
