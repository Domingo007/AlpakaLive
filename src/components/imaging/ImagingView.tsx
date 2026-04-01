import { useState, useRef } from 'react';
import { Card } from '@/components/shared/Card';
import { useDashboardData } from '@/hooks/useDatabase';
import { getRecistLabel, getRecistColor } from '@/lib/recist';
import type { ImagingStudy } from '@/types';

const IMAGING_TYPES = ['CT', 'PET', 'MRI', 'RTG', 'USG', 'mammography', 'bone_density', 'other'] as const;

export function ImagingView() {
  const { imaging, loading } = useDashboardData();
  const [selectedType, setSelectedType] = useState<string>('');
  const [bodyRegion, setBodyRegion] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // In full version: send to AI for analysis
    // For now: show placeholder
    alert('Analiza obrazowania wymaga klucza API. Dodaj go w Ustawieniach.');
    e.target.value = '';
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
      <h2 className="font-display text-lg font-semibold text-accent-dark">Obrazowanie</h2>

      {/* Upload section */}
      <Card title="Nowe badanie">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Typ badania</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-bg-primary"
            >
              <option value="">Wybierz typ...</option>
              {IMAGING_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Region ciala</label>
            <input
              value={bodyRegion}
              onChange={e => setBodyRegion(e.target.value)}
              placeholder="np. klatka piersiowa, brzuch..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-bg-primary"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium"
          >
            📷 Dodaj zdjecie badania
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="text-center text-text-secondary text-sm py-4">Ladowanie...</div>
      ) : imaging.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-text-secondary text-sm">
            <div className="text-3xl mb-3">🏥</div>
            <p>Brak badan obrazowych.</p>
            <p className="mt-1">Dodaj zdjecia RTG, CT, PET lub MRI aby sledzic zmiany w czasie.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-accent-dark">Historia badan</h3>
          {imaging.map(study => (
            <ImagingCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImagingCard({ study }: { study: ImagingStudy }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs text-text-secondary">{study.date}</div>
          <div className="text-sm font-medium">{study.type} — {study.bodyRegion}</div>
        </div>
        {study.images.length > 0 && (
          <span className="text-xs bg-accent-warm/50 px-2 py-0.5 rounded-full">
            {study.images.length} zdj.
          </span>
        )}
      </div>

      {study.tumors && study.tumors.length > 0 && (
        <div className="space-y-1 mt-2">
          {study.tumors.map((tumor, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span>{tumor.location}: {tumor.sizeMm.join('x')}mm</span>
              {tumor.recistResponse && (
                <span
                  className="px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                  style={{ backgroundColor: getRecistColor(tumor.recistResponse) }}
                >
                  {getRecistLabel(tumor.recistResponse)}
                </span>
              )}
              {tumor.changePercent !== undefined && (
                <span className={`text-[10px] font-medium ${tumor.changePercent < 0 ? 'text-alert-positive' : 'text-alert-critical'}`}>
                  {tumor.changePercent > 0 ? '+' : ''}{tumor.changePercent.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {study.aiAnalysis && (
        <div className="mt-2 text-xs text-text-secondary bg-bg-primary rounded-lg p-2">
          {study.aiAnalysis.slice(0, 200)}...
        </div>
      )}
    </Card>
  );
}
