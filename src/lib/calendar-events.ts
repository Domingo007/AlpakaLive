import { db } from './db';
import type { CalendarEvent, CalendarEventType, ChemoSession } from '@/types';

export const DEFAULT_EVENT_COLORS: Record<CalendarEventType, { color: string; icon: string; label: string }> = {
  chemo:              { color: '#e74c3c', icon: 'vaccines', label: 'Chemioterapia' },
  chemo_postponed:    { color: '#c0392b', icon: 'pause_circle', label: 'Chemia odroczona' },
  blood_test:         { color: '#3498db', icon: 'water_drop', label: 'Wyniki krwi' },
  imaging:            { color: '#9b59b6', icon: 'imagesmode', label: 'Badanie obrazowe' },
  daily_log:          { color: '#27ae60', icon: 'edit_note', label: 'Dziennik' },
  supplement:         { color: '#f39c12', icon: 'medication', label: 'Suplementy' },
  doctor_visit:       { color: '#1abc9c', icon: 'stethoscope', label: 'Wizyta lekarska' },
  side_effect:        { color: '#e67e22', icon: 'warning', label: 'Efekt uboczny' },
  weight:             { color: '#7f8c8d', icon: 'scale', label: 'Waga' },
  wearable_alert:     { color: '#c0392b', icon: 'watch', label: 'Alert opaski' },
  prediction:         { color: '#2c3e50', icon: 'auto_graph', label: 'Predykcja' },
  medication_change:  { color: '#d35400', icon: 'sync', label: 'Zmiana leczenia' },
  note:               { color: '#95a5a6', icon: 'push_pin', label: 'Notatka' },
  phase_a:            { color: '#e74c3c20', icon: '', label: 'Faza A' },
  phase_b:            { color: '#f39c1220', icon: '', label: 'Faza B' },
  phase_c:            { color: '#27ae6020', icon: '', label: 'Faza C' },
};

export async function buildCalendarEvents(): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  const [chemos, bloods, dailies, imagings, wearables, supplements, notes] = await Promise.all([
    db.chemo.toArray(),
    db.blood.toArray(),
    db.daily.toArray(),
    db.imaging.toArray(),
    db.wearable.toArray(),
    db.supplements.toArray(),
    db.calendarNotes.toArray(),
  ]);

  // CHEMO
  for (const c of chemos) {
    events.push({
      id: `chemo-${c.id}`,
      date: c.actualDate || c.date,
      type: c.status === 'postponed' ? 'chemo_postponed' : 'chemo',
      title: c.status === 'postponed' ? `Chemia odroczona → ${c.postponedTo || '?'}` : `Chemia #${c.cycle}`,
      subtitle: c.drugs?.join(' + '),
      color: DEFAULT_EVENT_COLORS[c.status === 'postponed' ? 'chemo_postponed' : 'chemo'].color,
      icon: c.status === 'postponed' ? '⏸️' : '💉',
      sourceId: c.id, sourceType: 'chemo',
      editable: true, allDay: true,
      data: { drugs: c.drugs, notes: c.notes, postponeReason: c.postponeReason },
    });
  }

  // PHASE BACKGROUNDS
  const completedChemos = chemos
    .filter(c => c.status === 'completed' || c.status === 'modified')
    .sort((a, b) => (a.actualDate || a.date).localeCompare(b.actualDate || b.date));

  for (const chemo of completedChemos) {
    const chemoDate = new Date(chemo.actualDate || chemo.date);
    for (let d = 0; d <= 21; d++) {
      const date = new Date(chemoDate);
      date.setDate(chemoDate.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      const phase = d <= 3 ? 'a' : d <= 7 ? 'b' : 'c';
      events.push({
        id: `phase-${dateStr}-${chemo.id}`,
        date: dateStr,
        type: `phase_${phase}` as CalendarEventType,
        title: '', color: DEFAULT_EVENT_COLORS[`phase_${phase}` as CalendarEventType].color,
        icon: '', editable: false, allDay: true,
        data: { phase: phase.toUpperCase(), dayInCycle: d },
      });
    }
  }

  // BLOOD
  for (const b of bloods) {
    const alerts: string[] = [];
    if (b.markers.wbc !== undefined && b.markers.wbc < 2) alerts.push('WBC↓');
    if (b.markers.hgb !== undefined && b.markers.hgb < 8) alerts.push('Hgb↓');
    if (b.markers.plt !== undefined && b.markers.plt < 50) alerts.push('PLT↓');
    events.push({
      id: `blood-${b.id}`, date: b.date, type: 'blood_test',
      title: `Krew${alerts.length ? ': ' + alerts.join(', ') : ''}`,
      subtitle: Object.entries(b.markers).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', '),
      color: alerts.length ? '#e74c3c' : DEFAULT_EVENT_COLORS.blood_test.color,
      icon: alerts.length ? '🔴' : '🩸',
      sourceId: b.id, sourceType: 'blood', editable: true, allDay: true, data: b.markers as Record<string, unknown>,
    });
  }

  // IMAGING
  for (const img of imagings) {
    events.push({
      id: `img-${img.id}`, date: img.date, type: 'imaging',
      title: `${img.type} ${img.bodyRegion || ''}`.trim(),
      subtitle: img.radiologistReport?.extractedData?.conclusion || img.notes || undefined,
      color: DEFAULT_EVENT_COLORS.imaging.color, icon: '🏥',
      sourceId: img.id, sourceType: 'imaging', editable: true, allDay: true,
    });
  }

  // DAILY LOGS
  for (const d of dailies) {
    events.push({
      id: `daily-${d.id}`, date: d.date, type: 'daily_log',
      title: `Energia: ${d.energy}/10`,
      subtitle: [d.pain > 3 ? `Ból: ${d.pain}` : null, d.nausea > 3 ? `Nudności: ${d.nausea}` : null, d.weight ? `${d.weight}kg` : null].filter(Boolean).join(', ') || undefined,
      color: d.energy <= 3 ? '#e74c3c' : d.energy <= 6 ? '#f39c12' : DEFAULT_EVENT_COLORS.daily_log.color,
      icon: d.energy <= 3 ? '😞' : d.energy <= 6 ? '😐' : '😊',
      sourceId: d.id, sourceType: 'daily', editable: true, allDay: true,
      data: { energy: d.energy, pain: d.pain, nausea: d.nausea, mood: d.mood, weight: d.weight },
    });
  }

  // WEARABLE ALERTS
  for (const w of wearables) {
    if (w.rhr > 85 || w.spo2 < 94) {
      events.push({
        id: `wear-${w.id}`, date: w.date, type: 'wearable_alert',
        title: w.rhr > 85 ? `RHR ${w.rhr} bpm ⚠️` : `SpO2 ${w.spo2}% ⚠️`,
        color: DEFAULT_EVENT_COLORS.wearable_alert.color, icon: '⌚',
        sourceId: w.id, sourceType: 'wearable', editable: false, allDay: true,
        data: { rhr: w.rhr, spo2: w.spo2, hrv: w.hrv },
      });
    }
  }

  // SUPPLEMENTS
  for (const s of supplements) {
    const taken = s.supplements.filter(x => x.taken).length;
    const total = s.supplements.length;
    if (total > 0) {
      events.push({
        id: `supp-${s.id}`, date: s.date, type: 'supplement',
        title: `Suplementy ${taken}/${total}`,
        color: DEFAULT_EVENT_COLORS.supplement.color, icon: '💊',
        sourceId: s.id, sourceType: 'supplements', editable: false, allDay: true,
      });
    }
  }

  // CALENDAR NOTES (doctor visits, notes)
  for (const n of notes) {
    events.push({
      id: `note-${n.id}`, date: n.date, type: n.type,
      title: n.title, subtitle: n.description,
      color: DEFAULT_EVENT_COLORS[n.type].color,
      icon: DEFAULT_EVENT_COLORS[n.type].icon,
      editable: true, allDay: !n.time, time: n.time,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function getEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter(e => e.date === date && !e.type.startsWith('phase_'));
}

export function getPhaseForDate(events: CalendarEvent[], date: string): string | null {
  const phase = events.find(e => e.date === date && e.type.startsWith('phase_'));
  return phase ? (phase.data?.phase as string) || null : null;
}

export function getUpcomingEvents(events: CalendarEvent[], days = 7): CalendarEvent[] {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + days);
  const todayStr = today.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return events.filter(e => e.date >= todayStr && e.date <= endStr && !e.type.startsWith('phase_') && e.title);
}
