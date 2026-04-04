import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';

const TYPES = ['CT', 'MRI', 'PET', 'PET_CT', 'RTG', 'USG', 'mammography', 'bone_scan', 'other'] as const;

interface TumorEntry {
  location: string;
  width: string;
  height: string;
}

export function ImagingEntryForm() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('');
  const [bodyRegion, setBodyRegion] = useState('');
  const [description, setDescription] = useState('');
  const [tumors, setTumors] = useState<TumorEntry[]>([{ location: '', width: '', height: '' }]);
  const [saved, setSaved] = useState(false);

  function addTumor() {
    setTumors(prev => [...prev, { location: '', width: '', height: '' }]);
  }

  function updateTumor(i: number, field: keyof TumorEntry, value: string) {
    setTumors(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  function removeTumor(i: number) {
    setTumors(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!type || !date) return;

    const tumorMeasurements = tumors
      .filter(t => t.location && (t.width || t.height))
      .map(t => ({
        location: t.location,
        sizeMm: [parseFloat(t.width) || 0, parseFloat(t.height) || 0].filter(v => v > 0),
      }));

    await db.imaging.put({
      id: uuidv4(), date, type: type as any, bodyRegion,
      images: [], findings: description, notes: '',
      tumors: tumorMeasurements.length > 0 ? tumorMeasurements : undefined,
      radiologistReport: description ? {
        originalText: description,
        originalLanguage: 'pl',
      } : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card title="Dodaj badanie obrazowe">
      <DisclaimerBanner variant="imaging" />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Typ</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary">
              <option value="">Wybierz...</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary" />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Region ciała</label>
          <input value={bodyRegion} onChange={e => setBodyRegion(e.target.value)}
            placeholder="np. klatka piersiowa, brzuch..."
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Opis (wklej tekst opisu radiologa)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Wklej tutaj opis badania radiologicznego..."
            rows={4} className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary resize-y" />
        </div>

        {/* Tumor measurements */}
        <div>
          <label className="text-xs text-text-secondary block mb-1">Rozmiary zmian (ręcznie)</label>
          {tumors.map((t, i) => (
            <div key={i} className="flex gap-1 items-center mb-1">
              <input value={t.location} onChange={e => updateTumor(i, 'location', e.target.value)}
                placeholder="Lokalizacja" className="flex-1 rounded border border-border px-2 py-1 text-[11px] bg-bg-primary" />
              <input value={t.width} onChange={e => updateTumor(i, 'width', e.target.value)}
                placeholder="mm" type="number" className="w-14 rounded border border-border px-1 py-1 text-[11px] bg-bg-primary text-center" />
              <span className="text-text-secondary text-[10px]">x</span>
              <input value={t.height} onChange={e => updateTumor(i, 'height', e.target.value)}
                placeholder="mm" type="number" className="w-14 rounded border border-border px-1 py-1 text-[11px] bg-bg-primary text-center" />
              <button onClick={() => removeTumor(i)} className="text-alert-critical text-xs">×</button>
            </div>
          ))}
          <button onClick={addTumor} className="text-xs text-accent-dark underline">+ Dodaj zmianę</button>
        </div>

        <button onClick={handleSave} disabled={!type || !date}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
          {saved ? '✓ Zapisano!' : 'Zapisz badanie'}
        </button>
      </div>
    </Card>
  );
}
