import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import type { SupplementEntry } from '@/types';

const DEFAULT_SUPPLEMENTS: SupplementEntry[] = [
  { name: 'Witamina D3 2000 IU', dose: '2000 IU', taken: false },
  { name: 'L-Glutamina', dose: '30g', taken: false },
  { name: 'Omega-3 EPA/DHA', dose: '640mg 3x', taken: false },
  { name: 'Probiotyk', dose: '10 mld CFU', taken: false },
];

export function SupplementTracker() {
  const [supplements, setSupplements] = useState<SupplementEntry[]>(DEFAULT_SUPPLEMENTS);
  const [saved, setSaved] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');

  useEffect(() => {
    // Load today's supplements if they exist
    const today = new Date().toISOString().split('T')[0];
    db.supplements.where('date').equals(today).first().then(existing => {
      if (existing) setSupplements(existing.supplements);
    });
  }, []);

  function toggleSupplement(index: number) {
    setSupplements(prev => prev.map((s, i) => i === index ? {
      ...s,
      taken: !s.taken,
      time: !s.taken ? new Date().toTimeString().slice(0, 5) : undefined,
    } : s));
    setSaved(false);
  }

  function addSupplement() {
    if (!newName.trim()) return;
    setSupplements(prev => [...prev, { name: newName.trim(), dose: newDose.trim(), taken: false }]);
    setNewName('');
    setNewDose('');
  }

  function removeSupplement(index: number) {
    setSupplements(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.supplements.where('date').equals(today).first();
    if (existing) {
      await db.supplements.update(existing.id, { supplements });
    } else {
      await db.supplements.put({ id: uuidv4(), date: today, supplements });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const taken = supplements.filter(s => s.taken).length;

  return (
    <Card title={`💊 Suplementy (${taken}/${supplements.length})`}>
      <div className="space-y-2">
        {supplements.map((s, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <button onClick={() => toggleSupplement(i)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs shrink-0 ${
                s.taken ? 'bg-accent-green border-accent-green text-white' : 'border-border'
              }`}>
              {s.taken && '✓'}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-xs ${s.taken ? 'line-through text-text-secondary' : 'font-medium'}`}>
                {s.name}
              </div>
              <div className="text-[10px] text-text-secondary">
                {s.dose}{s.time ? ` — ${s.time}` : ''}
              </div>
            </div>
            <button onClick={() => removeSupplement(i)} className="text-text-secondary text-xs p-1">×</button>
          </div>
        ))}

        {/* Add new */}
        <div className="border-t border-border pt-2 flex gap-1">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nazwa"
            className="flex-1 rounded border border-border px-2 py-1 text-[11px] bg-bg-primary" />
          <input value={newDose} onChange={e => setNewDose(e.target.value)} placeholder="Dawka"
            className="w-20 rounded border border-border px-2 py-1 text-[11px] bg-bg-primary" />
          <button onClick={addSupplement} disabled={!newName.trim()}
            className="px-2 py-1 rounded bg-accent-dark text-accent-warm text-[11px] disabled:opacity-40">+</button>
        </div>

        <button onClick={handleSave}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-2.5 text-sm font-medium">
          {saved ? '✓ Zapisano!' : 'Zapisz'}
        </button>

        <p className="text-[9px] text-text-secondary text-center">
          * Informacje o suplementach z opublikowanych badań. Nie stanowią rekomendacji. Konsultuj z lekarzem.
        </p>
      </div>
    </Card>
  );
}
