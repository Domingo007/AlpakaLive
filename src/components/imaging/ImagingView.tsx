import { useState, useRef } from 'react';
import { Card } from '@/components/shared/Card';
import { useDashboardData } from '@/hooks/useDatabase';
import { getRecistLabel, getRecistColor } from '@/lib/recist';
import type { ImagingStudy } from '@/types';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IMAGING_TYPES = ['CT', 'PET', 'PET_CT', 'MRI', 'RTG', 'USG', 'mammography', 'bone_scan', 'bone_density', 'other'] as const;

type InputMode = 'photo' | 'text';

export function ImagingView() {
  const { imaging, loading } = useDashboardData();
  const [selectedType, setSelectedType] = useState<string>('');
  const [bodyRegion, setBodyRegion] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [reportText, setReportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { t, lang } = useI18n();

  const bodyRegions = [
    t.imaging.bodyRegions.chest,
    t.imaging.bodyRegions.abdomen,
    `${t.imaging.bodyRegions.chest} + ${t.imaging.bodyRegions.abdomen.toLowerCase()}`,
    t.imaging.bodyRegions.headBrain,
    t.imaging.bodyRegions.bones,
    t.imaging.bodyRegions.wholeBody,
    t.imaging.bodyRegions.breasts,
    t.imaging.bodyRegions.other,
  ];

  function handleReportPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(t.imaging.reportApiNeeded);
    e.target.value = '';
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(t.imaging.imagingApiNeeded);
    e.target.value = '';
  }

  function handleAnalyze() {
    if (!reportText.trim()) {
      alert(t.imaging.pasteOrPhoto);
      return;
    }
    alert(t.imaging.reportApiClaudeNeeded);
  }

  const tumorTimeline = buildTumorTimeline(imaging);

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
      <h2 className="font-display text-lg font-semibold text-accent-dark">{t.imaging.title}</h2>
      <DisclaimerBanner variant="imaging" />

      <Card title={t.imaging.addStudy}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t.imaging.studyType}</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary"
              >
                <option value="">{t.imaging.choose}</option>
                {IMAGING_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t.imaging.studyDate}</label>
              <input
                type="date"
                value={studyDate}
                onChange={e => setStudyDate(e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">{t.imaging.bodyRegion}</label>
            <select
              value={bodyRegion}
              onChange={e => setBodyRegion(e.target.value)}
              className="w-full rounded-lg border border-border px-2 py-2 text-xs bg-bg-primary"
            >
              <option value="">{t.imaging.choose}</option>
              {bodyRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">{t.imaging.radiologyReport}</label>
            <div className="flex gap-1 mb-2">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-1.5 rounded-lg text-xs ${inputMode === 'text' ? 'bg-accent-dark text-accent-warm' : 'bg-bg-primary border border-border'}`}
              >
                <Icon name="content_paste" size={14} className="inline-block mr-1" />{t.imaging.pasteText}
              </button>
              <button
                onClick={() => setInputMode('photo')}
                className={`flex-1 py-1.5 rounded-lg text-xs ${inputMode === 'photo' ? 'bg-accent-dark text-accent-warm' : 'bg-bg-primary border border-border'}`}
              >
                <Icon name="photo_camera" size={14} className="inline-block mr-1" />{t.imaging.reportPhoto}
              </button>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                placeholder={t.imaging.pastePlaceholder}
                rows={6}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary resize-y min-h-[100px]"
              />
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg py-4 text-xs text-text-secondary"
                >
                  <Icon name="photo_camera" size={16} className="inline-block mr-1" />{t.imaging.reportPhotoTitle}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReportPhoto} />
              </>
            )}
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">{t.imaging.studyPhotosOptional}</label>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full border border-border rounded-lg py-2 text-xs text-text-secondary"
            >
              <Icon name="photo_camera" size={16} className="inline-block mr-1" />{t.imaging.addStudyPhotos}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          </div>

          <p className="text-[10px] text-text-secondary">
            <Icon name="lightbulb" size={14} className="inline-block mr-0.5 text-lavender-500" />{t.imaging.reportImportant}
          </p>

          <button
            onClick={handleAnalyze}
            disabled={!selectedType}
            className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40"
          >
            {t.imaging.analyze}
          </button>
        </div>
      </Card>

      {tumorTimeline.length > 0 && (
        <Card title={t.imaging.tumorHistory}>
          <DisclaimerBanner variant="data" />
          {tumorTimeline.map(tumor => (
            <TumorTimelineChart key={tumor.location} tumor={tumor} />
          ))}
        </Card>
      )}

      {loading ? (
        <div className="text-center text-text-secondary text-sm py-4">{t.common.loading}</div>
      ) : imaging.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-text-secondary text-sm">
            <div className="text-lavender-400 mb-3"><Icon name="imagesmode" size={48} /></div>
            <p>{t.imaging.noStudies}</p>
            <p className="mt-1">{t.imaging.noStudiesHint}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-accent-dark">{t.imaging.studyHistory}</h3>
          {imaging.map(study => (
            <ImagingCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImagingCard({ study }: { study: ImagingStudy }) {
  const { t } = useI18n();
  const hasReport = study.radiologistReport?.originalText;

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs text-text-secondary">{study.date}</div>
          <div className="text-sm font-medium">{study.type} — {study.bodyRegion}</div>
        </div>
        <div className="flex gap-1">
          {hasReport && (
            <span className="text-[10px] bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full">{t.imaging.report}</span>
          )}
          {study.images.length > 0 && (
            <span className="text-[10px] bg-accent-warm/50 px-2 py-0.5 rounded-full">{t.imaging.photos(study.images.length)}</span>
          )}
        </div>
      </div>

      {study.radiologistReport?.translatedSummary && (
        <div className="text-xs text-text-secondary bg-bg-primary rounded-lg p-2 mb-2">
          {study.radiologistReport.translatedSummary}
        </div>
      )}

      {study.radiologistReport?.extractedData?.tumors && study.radiologistReport.extractedData.tumors.length > 0 && (
        <div className="space-y-1 mt-2">
          {study.radiologistReport.extractedData.tumors.map((tumor, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span>{tumor.locationTranslated}: {tumor.currentSize.dimensions.join('x')}mm</span>
              {tumor.change && (
                <span className={`text-[10px] font-medium ${
                  tumor.change.type === 'shrinking' ? 'text-alert-positive' :
                  tumor.change.type === 'growing' || tumor.change.type === 'new' ? 'text-alert-critical' :
                  'text-text-secondary'
                }`}>
                  {tumor.change.type === 'new' ? t.imaging.newLabel :
                   tumor.change.percentChange !== undefined ? `${tumor.change.percentChange > 0 ? '+' : ''}${tumor.change.percentChange.toFixed(1)}%` :
                   tumor.change.type}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {(!study.radiologistReport?.extractedData?.tumors || study.radiologistReport.extractedData.tumors.length === 0) &&
       study.tumors && study.tumors.length > 0 && (
        <div className="space-y-1 mt-2">
          {study.tumors.map((tumor, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span>{tumor.location}: {tumor.sizeMm.join('x')}mm</span>
              {tumor.recistResponse && (
                <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-medium" style={{ backgroundColor: getRecistColor(tumor.recistResponse) }}>
                  {getRecistLabel(tumor.recistResponse)}
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

      {study.combinedAnalysis?.questionsForDoctor && study.combinedAnalysis.questionsForDoctor.length > 0 && (
        <div className="mt-2 space-y-0.5">
          <div className="text-[10px] font-medium text-accent-dark">{t.imaging.questionsForOncologist}</div>
          {study.combinedAnalysis.questionsForDoctor.map((q, i) => (
            <div key={i} className="text-[10px] text-text-secondary">• {q}</div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface TumorTimelineData {
  location: string;
  dataPoints: { date: string; size: number; chemo?: string }[];
  totalChange?: number;
  lastChange?: number;
}

function buildTumorTimeline(studies: ImagingStudy[]): TumorTimelineData[] {
  const tumorMap = new Map<string, { date: string; size: number }[]>();
  const sorted = [...studies].sort((a, b) => a.date.localeCompare(b.date));

  for (const study of sorted) {
    if (study.radiologistReport?.extractedData?.tumors) {
      for (const tumor of study.radiologistReport.extractedData.tumors) {
        const key = tumor.locationTranslated || tumor.location;
        if (!tumorMap.has(key)) tumorMap.set(key, []);
        const maxDim = Math.max(...tumor.currentSize.dimensions);
        tumorMap.get(key)!.push({ date: study.date, size: maxDim });
      }
    }
    if (study.tumors) {
      for (const tumor of study.tumors) {
        const key = tumor.location;
        if (!tumorMap.has(key)) tumorMap.set(key, []);
        const maxDim = Math.max(...tumor.sizeMm);
        if (!tumorMap.get(key)!.some(p => p.date === study.date)) {
          tumorMap.get(key)!.push({ date: study.date, size: maxDim });
        }
      }
    }
  }

  const result: TumorTimelineData[] = [];
  for (const [location, points] of tumorMap) {
    if (points.length < 2) continue;
    const first = points[0].size;
    const last = points[points.length - 1].size;
    const prev = points.length >= 2 ? points[points.length - 2].size : first;
    result.push({
      location,
      dataPoints: points,
      totalChange: Math.round(((last - first) / first) * 100 * 10) / 10,
      lastChange: Math.round(((last - prev) / prev) * 100 * 10) / 10,
    });
  }

  return result;
}

function TumorTimelineChart({ tumor }: { tumor: TumorTimelineData }) {
  const { t } = useI18n();
  const chartData = tumor.dataPoints.map(p => ({
    date: p.date.slice(5),
    mm: p.size,
  }));

  const changeColor = (tumor.totalChange ?? 0) <= 0 ? '#27ae60' : '#e74c3c';

  return (
    <div className="mb-4 pb-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">{tumor.location}</span>
        <div className="text-right">
          {tumor.totalChange !== undefined && (
            <span className="text-[10px] font-medium" style={{ color: changeColor }}>
              {tumor.totalChange > 0 ? '+' : ''}{tumor.totalChange}% {t.imaging.sinceFirstMeasurement}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit="mm" />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="mm" stroke={changeColor} strokeWidth={2} dot={{ r: 4, fill: changeColor }} />
        </LineChart>
      </ResponsiveContainer>

      <div className="text-[9px] text-text-secondary text-center mt-1">
        {t.imaging.dataNote}
      </div>
    </div>
  );
}
