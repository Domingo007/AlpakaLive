import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { Card } from '@/components/shared/Card';
import { useI18n } from '@/lib/i18n';

export function DailyLogForm() {
  const [energy, setEnergy] = useState(5);
  const [pain, setPain] = useState(0);
  const [nausea, setNausea] = useState(0);
  const [mood, setMood] = useState(5);
  const [neuropathy, setNeuropathy] = useState(0);
  const [appetite, setAppetite] = useState(5);
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [hydration, setHydration] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  async function handleSave() {
    const today = new Date().toISOString().split('T')[0];
    await db.daily.put({
      id: uuidv4(),
      date: today,
      time: new Date().toTimeString().slice(0, 5),
      energy, pain, nausea, mood, neuropathy, appetite,
      weight: weight ? parseFloat(weight) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      bpSystolic: bpSystolic ? parseInt(bpSystolic) : undefined,
      bpDiastolic: bpDiastolic ? parseInt(bpDiastolic) : undefined,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      hydration: hydration ? parseFloat(hydration) : undefined,
      sleep: sleepHours ? { hours: parseFloat(sleepHours), quality: 5 } : undefined,
      notes,
      chemoPhase: null,
      dayInCycle: 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card title={t.dailyLog.title}>
      <div className="space-y-4">
        <SliderField label={t.dailyLog.energy} value={energy} onChange={setEnergy} min={1} max={10} emoji={energy <= 3 ? '😞' : energy <= 6 ? '😐' : '😊'} />
        <SliderField label={t.dailyLog.pain} value={pain} onChange={setPain} min={0} max={10} emoji={pain >= 7 ? '😣' : pain >= 4 ? '😕' : '😌'} />
        <SliderField label={t.dailyLog.nausea} value={nausea} onChange={setNausea} min={0} max={10} />
        <SliderField label={t.dailyLog.mood} value={mood} onChange={setMood} min={1} max={10} />
        <SliderField label={t.dailyLog.neuropathy} value={neuropathy} onChange={setNeuropathy} min={0} max={4} />
        <SliderField label={t.dailyLog.appetite} value={appetite} onChange={setAppetite} min={1} max={10} />

        <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
          <NumField label={t.dailyLog.weight} value={weight} onChange={setWeight} placeholder="54.5" />
          <NumField label={t.dailyLog.temperature} value={temperature} onChange={setTemperature} placeholder="36.6" />
          <NumField label={t.dailyLog.bpSystolic} value={bpSystolic} onChange={setBpSystolic} placeholder="120" />
          <NumField label={t.dailyLog.bpDiastolic} value={bpDiastolic} onChange={setBpDiastolic} placeholder="80" />
          <NumField label={t.dailyLog.heartRate} value={heartRate} onChange={setHeartRate} placeholder="72" />
          <NumField label={t.dailyLog.hydration} value={hydration} onChange={setHydration} placeholder="2.0" />
          <NumField label={t.dailyLog.sleep} value={sleepHours} onChange={setSleepHours} placeholder="7" />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">{t.dailyLog.notesLabel}</label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={t.dailyLog.notesPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2 text-xs bg-bg-primary resize-y"
          />
        </div>

        <button onClick={handleSave} className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium">
          {saved ? t.common.saved : t.dailyLog.saveEntry}
        </button>
      </div>
    </Card>
  );
}

function SliderField({ label, value, onChange, min, max, emoji }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; emoji?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-sm font-medium">{emoji ? `${emoji} ` : ''}{value}/{max}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-border accent-accent-dark"
      />
    </div>
  );
}

function NumField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-text-secondary block mb-0.5">{label}</label>
      <input
        type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-2 py-1.5 text-xs bg-bg-primary"
      />
    </div>
  );
}
