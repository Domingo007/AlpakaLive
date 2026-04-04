import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { buildCalendarEvents, getEventsForDate, getPhaseForDate, DEFAULT_EVENT_COLORS } from '@/lib/calendar-events';
import { db } from '@/lib/db';
import { getPhaseColor } from '@/lib/phase-calculator';
import { Icon } from '@/components/shared/Icon';
import type { CalendarEvent, CalendarEventType } from '@/types';

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<CalendarEventType>>(new Set(['phase_a', 'phase_b', 'phase_c']));
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteType, setNoteType] = useState<'doctor_visit' | 'note'>('note');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const ev = await buildCalendarEvents();
    setEvents(ev);
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const today = new Date().toISOString().split('T')[0];

  function shiftMonth(delta: number) {
    setViewMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return d; });
    setSelectedDate(null);
  }

  function toggleType(type: CalendarEventType) {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  async function addNote() {
    if (!noteTitle.trim() || !selectedDate) return;
    await db.calendarNotes.put({
      id: uuidv4(), date: selectedDate, type: noteType,
      title: noteTitle.trim(),
    });
    setNoteTitle('');
    setShowAddMenu(false);
    loadEvents();
  }

  const visibleEvents = events.filter(e => !hiddenTypes.has(e.type));

  // Calendar grid
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthName = viewMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  // Events for selected date
  const selectedEvents = selectedDate ? getEventsForDate(visibleEvents, selectedDate) : [];
  const selectedPhase = selectedDate ? getPhaseForDate(events, selectedDate) : null;

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="p-2 text-lg">◀</button>
        <h2 className="font-display text-base font-semibold text-accent-dark capitalize">{monthName}</h2>
        <button onClick={() => shiftMonth(1)} className="p-2 text-lg">▶</button>
      </div>

      {/* Month grid */}
      {loading ? (
        <div className="text-center py-8 text-text-secondary text-sm">Ładowanie...</div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {/* Weekday headers */}
          {WEEKDAYS.map(d => (
            <div key={d} className="bg-bg-card text-center text-[9px] text-text-secondary font-medium py-1.5">{d}</div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`e-${i}`} className="bg-bg-primary min-h-[52px]" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayEvents = getEventsForDate(visibleEvents, dateStr);
            const phase = getPhaseForDate(events, dateStr);
            const phaseBg = phase ? getPhaseColor(phase as 'A' | 'B' | 'C') + '15' : undefined;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`min-h-[52px] p-1 text-left relative transition-colors ${
                  isSelected ? 'ring-2 ring-accent-dark' : ''
                } ${isToday ? 'bg-accent-warm/30' : 'bg-bg-card'}`}
                style={phaseBg ? { backgroundColor: phaseBg } : undefined}
              >
                <div className={`text-[10px] ${isToday ? 'font-bold text-accent-dark' : 'text-text-primary'}`}>{day}</div>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 4).map(ev => (
                    <span key={ev.id} title={ev.title} style={{ color: ev.color }}>
                      {ev.icon ? <Icon name={ev.icon} size={10} /> : null}
                    </span>
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-[7px] text-text-secondary">+{dayEvents.length - 4}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend / filters */}
      <div className="flex flex-wrap gap-1.5">
        {(['chemo', 'blood_test', 'imaging', 'daily_log', 'supplement', 'doctor_visit', 'radiotherapy_session', 'immunotherapy_infusion', 'targeted_therapy', 'hormonal_therapy', 'wearable_alert', 'note'] as CalendarEventType[]).map(type => {
          const cfg = DEFAULT_EVENT_COLORS[type];
          const hidden = hiddenTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] border transition-opacity ${
                hidden ? 'opacity-30 border-border' : 'border-transparent'
              }`}
              style={!hidden ? { backgroundColor: cfg.color + '20', color: cfg.color } : undefined}
            >
              {cfg.icon && <Icon name={cfg.icon} size={14} />}
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-bg-card rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">
                {new Date(selectedDate + 'T12:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {selectedPhase && (
                <div className="text-[10px] font-medium" style={{ color: getPhaseColor(selectedPhase as 'A' | 'B' | 'C') }}>
                  Faza {selectedPhase} — {selectedPhase === 'A' ? 'kryzys' : selectedPhase === 'B' ? 'regeneracja' : 'odbudowa'}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="text-xs bg-accent-dark text-accent-warm px-3 py-1 rounded-lg"
            >
              + Dodaj
            </button>
          </div>

          {/* Add event menu */}
          {showAddMenu && (
            <div className="bg-bg-primary rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setNoteType('doctor_visit')}
                  className={`flex-1 py-1.5 rounded text-[10px] ${noteType === 'doctor_visit' ? 'bg-accent-dark text-accent-warm' : 'border border-border'}`}
                >
                  Wizyta lekarska
                </button>
                <button
                  onClick={() => setNoteType('note')}
                  className={`flex-1 py-1.5 rounded text-[10px] ${noteType === 'note' ? 'bg-accent-dark text-accent-warm' : 'border border-border'}`}
                >
                  Notatka
                </button>
              </div>
              <input
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder={noteType === 'doctor_visit' ? 'np. Wizyta u onkologa' : 'Treść notatki...'}
                className="w-full rounded border border-border px-2 py-1.5 text-xs bg-bg-card"
              />
              <button onClick={addNote} disabled={!noteTitle.trim()} className="w-full bg-accent-dark text-accent-warm rounded py-1.5 text-xs disabled:opacity-40">
                Zapisz
              </button>
            </div>
          )}

          {/* Day events */}
          {selectedEvents.length === 0 ? (
            <div className="text-xs text-text-secondary text-center py-3">Brak zdarzeń w tym dniu</div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <DayEventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}

          <div className="text-[9px] text-text-secondary text-center pt-1">
            * Wartości referencyjne z opublikowanej literatury. Konsultuj z lekarzem.
          </div>
        </div>
      )}
    </div>
  );
}

function DayEventCard({ event }: { event: CalendarEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg p-2 border transition-colors"
      style={{ borderColor: event.color + '40', backgroundColor: event.color + '08' }}
    >
      <div className="flex items-center gap-2">
        {event.icon && <Icon name={event.icon} size={18} className="shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{event.title}</div>
          {event.subtitle && <div className="text-[10px] text-text-secondary truncate">{event.subtitle}</div>}
        </div>
        {event.time && <span className="text-[10px] text-text-secondary">{event.time}</span>}
      </div>

      {expanded && event.data && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5">
          {Object.entries(event.data).map(([key, value]) => {
            if (value === null || value === undefined || typeof value === 'object') return null;
            return (
              <div key={key} className="flex justify-between text-[10px]">
                <span className="text-text-secondary">{key}</span>
                <span>{String(value)}</span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}
