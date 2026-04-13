import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import { SUPPLEMENTS } from '@/lib/medical-data/knowledge-registry';
import { localized } from '@/lib/medical-data/content-utils';
import type { SupplementEntry } from '@/types';

const DEFAULT_SUPPLEMENTS: SupplementEntry[] = [
  { name: 'Witamina D3 2000 IU', dose: '2000 IU', taken: false },
  { name: 'L-Glutamina', dose: '30g', taken: false },
  { name: 'Omega-3 EPA/DHA', dose: '640mg 3x', taken: false },
  { name: 'Probiotyk', dose: '10 mld CFU', taken: false },
];

const EVIDENCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  strong: { bg: 'bg-accent-green/10', text: 'text-accent-green', icon: 'verified' },
  moderate: { bg: 'bg-alert-warning/10', text: 'text-alert-warning', icon: 'science' },
  preclinical: { bg: 'bg-alert-critical/10', text: 'text-alert-critical', icon: 'biotech' },
  CONTRAINDICATED: { bg: 'bg-alert-critical/20', text: 'text-alert-critical', icon: 'dangerous' },
};

function findEvidence(name: string) {
  const lower = name.toLowerCase();
  return SUPPLEMENTS.supplements.find((s: { id: string; name: Record<string, string> }) =>
    lower.includes(s.id.replace(/_/g, ' ')) ||
    lower.includes(s.id) ||
    Object.values(s.name).some(n => lower.includes(n.toLowerCase())) ||
    s.id === 'vitamin_d3' && (lower.includes('d3') || lower.includes('witamina d')) ||
    s.id === 'omega3' && lower.includes('omega') ||
    s.id === 'l_glutamine' && lower.includes('glutamin') ||
    s.id === 'probiotics' && lower.includes('probiot') ||
    s.id === 'curcumin' && lower.includes('kurkum') ||
    s.id === 'magnesium' && lower.includes('magnez') ||
    s.id === 'st_johns_wort' && (lower.includes('dziurawiec') || lower.includes('john'))
  ) as { evidenceLevel: string; context: Record<string, string>; sources: string[]; cautions?: { pl?: string; en?: string }[] } | undefined;
}

export function SupplementTracker() {
  const [supplements, setSupplements] = useState<SupplementEntry[]>(DEFAULT_SUPPLEMENTS);
  const [saved, setSaved] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [expandedEvidence, setExpandedEvidence] = useState<number | null>(null);
  const { t, lang } = useI18n();

  useEffect(() => {
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

  const evidenceLabel = lang === 'pl'
    ? { strong: 'Silne dowody', moderate: 'Umiarkowane', preclinical: 'Przedkliniczne', CONTRAINDICATED: 'PRZECIWWSKAZANE', unknown: 'Brak danych' }
    : { strong: 'Strong evidence', moderate: 'Moderate', preclinical: 'Preclinical', CONTRAINDICATED: 'CONTRAINDICATED', unknown: 'No data' };

  return (
    <Card title={t.supplements.title(taken, supplements.length)}>
      <div className="space-y-2">
        {supplements.map((s, i) => {
          const evidence = findEvidence(s.name);
          const evStyle = evidence ? EVIDENCE_COLORS[evidence.evidenceLevel] || EVIDENCE_COLORS.preclinical : null;
          const isExpanded = expandedEvidence === i;

          return (
            <div key={i}>
              <div className="flex items-center gap-2 py-1">
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
                {evidence && (
                  <button
                    onClick={() => setExpandedEvidence(isExpanded ? null : i)}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${evStyle?.bg} ${evStyle?.text}`}
                    title={lang === 'pl' ? 'Pokaż dowody' : 'Show evidence'}
                  >
                    <Icon name={evStyle?.icon || 'info'} size={12} />
                    {evidence.evidenceLevel === 'CONTRAINDICATED' ? '!' : ''}
                  </button>
                )}
                <button onClick={() => removeSupplement(i)} className="text-text-secondary text-xs p-1 shrink-0">×</button>
              </div>

              {/* Evidence panel */}
              {isExpanded && evidence && (
                <div className={`ml-8 mr-6 mb-1 rounded-lg p-2.5 text-[11px] leading-relaxed ${evStyle?.bg}`}>
                  <div className={`font-semibold mb-1 ${evStyle?.text}`}>
                    {(evidenceLabel as Record<string, string>)[evidence.evidenceLevel] || evidenceLabel.unknown}
                  </div>
                  <div className="text-text-primary">
                    {localized(evidence.context, lang)}
                  </div>
                  {evidence.cautions && evidence.cautions.length > 0 && (
                    <div className="mt-1.5 text-alert-warning font-medium">
                      {evidence.cautions.map((c: Record<string, string>, j: number) => (
                        <div key={j}>⚠️ {localized(c, lang)}</div>
                      ))}
                    </div>
                  )}
                  {evidence.sources && evidence.sources.length > 0 && (
                    <div className="mt-1.5 text-text-tertiary text-[9px]">
                      {lang === 'pl' ? 'Źródła' : 'Sources'}: {evidence.sources.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="border-t border-border pt-2 flex gap-1">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.supplements.name}
            className="flex-1 rounded border border-border px-2 py-1 text-[11px] bg-bg-primary" />
          <input value={newDose} onChange={e => setNewDose(e.target.value)} placeholder={t.supplements.dose}
            className="w-20 rounded border border-border px-2 py-1 text-[11px] bg-bg-primary" />
          <button onClick={addSupplement} disabled={!newName.trim()}
            className="px-2 py-1 rounded bg-accent-dark text-accent-warm text-[11px] disabled:opacity-40">+</button>
        </div>

        <button onClick={handleSave}
          className="w-full bg-accent-dark text-accent-warm rounded-xl py-2.5 text-sm font-medium">
          {saved ? t.common.saved : t.common.save}
        </button>

        <p className="text-[9px] text-text-secondary text-center">
          {t.supplements.referenceNote}
        </p>
      </div>
    </Card>
  );
}
