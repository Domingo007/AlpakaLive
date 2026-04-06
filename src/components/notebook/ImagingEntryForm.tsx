import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();

  function addTumor() {
    setTumors(prev => [...prev, { location: '', width: '', height: '' }]);
  }

  function updateTumor(i: number, field: keyof TumorEntry, value: string) {
    setTumors(prev => prev.map((tu, idx) => idx === i ? { ...tu, [field]: value } : tu));
  }

  function removeTumor(i: number) {
    setTumors(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!type || !date) return;

    const tumorMeasurements = tumors
      .filter(tu => tu.location && (tu.width || tu.height))
      .map(tu => ({
        location: tu.location,
        sizeMm: [parseFloat(tu.width) || 0, parseFloat(tu.height) || 0].filter(v => v > 0),
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
    <Card title={t.imagingEntry.title}>
      <DisclaimerBanner variant="imaging" />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t.imagingEntry.type}</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary">
              <option value="">{t.imaging.choose}</option>
              {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t.common.date}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary" />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.imagingEntry.bodyRegion}</label>
          <input value={bodyRegion} onChange={e => setBodyRegion(e.target.value)}
            placeholder={t.imagingEntry.bodyRegionPlaceholder}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary" />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.imagingEntry.descriptionLabel}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t.imagingEntry.descriptionPlaceholder}
            rows={4} className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary resize-y" />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.imagingEntry.lesionSizes}</label>
          {tumors.map((tu, i) => (
            <div key={i} className="flex gap-1 items-center mb-1">
              <input value={tu.location} onChange={e => updateTumor(i, 'location', e.target.value)}
                placeholder={t.imagingEntry.location} className="flex-1 rounded border border-border px-2 py-1 text-[11px] bg-bg-primary" />
              <input value={tu.width} onChange={e => updateTumor(i, 'width', e.target.value)}
                placeholder={t.imagingEntry.mm} type="number" className="w-14 rounded border border-border px-1 py-1 text-[11px] bg-bg-primary text-center" />
              <span className="text-text-secondary text-[10px]">x</span>
              <input value={tu.height} onChange={e => updateTumor(i, 'height', e.target.value)}
                placeholder={t.imagingEntry.mm} type="number" className="w-14 rounded border border-border px-1 py-1 text-[11px] bg-bg-primary text-center" />
              <button onClick={() => removeTumor(i)} className="text-alert-critical text-xs">×</button>
            </div>
          ))}
          <button onClick={addTumor} className="text-xs text-accent-dark underline">{t.imagingEntry.addLesion}</button>
        </div>

        <button onClick={handleSave} disabled={!type || !date}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
          {saved ? t.common.saved : t.imagingEntry.saveStudy}
        </button>
      </div>
    </Card>
  );
}
