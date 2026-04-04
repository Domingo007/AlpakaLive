/*
 * AlpacaLive — Your Companion Through Cancer Treatment
 * Copyright (C) 2025 AlpacaLive Contributors
 * Licensed under AGPL-3.0 — see LICENSE file
 */
import { jsPDF } from 'jspdf';
import { db } from './db';
import { BLOOD_NORMS, evaluateMarker, getStatusIcon } from './blood-norms';
import { calculateCurrentPhase, getPhaseLabel } from './phase-calculator';
import type { PatientProfile, DailyLog, BloodWork, ChemoSession, WearableData, SupplementLog } from '@/types';

interface ReportData {
  patient: PatientProfile;
  daily: DailyLog[];
  blood: BloodWork[];
  chemo: ChemoSession[];
  wearable: WearableData[];
  supplements: SupplementLog[];
  periodStart: string;
  periodEnd: string;
}

// ==================== DATA LOADING ====================

export async function loadReportData(daysBack = 30): Promise<ReportData | null> {
  const patients = await db.patient.toArray();
  const patient = patients[0];
  if (!patient) return null;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);

  const periodStart = startDate.toISOString().split('T')[0];
  const periodEnd = endDate.toISOString().split('T')[0];

  const [daily, blood, chemo, wearable, supplements] = await Promise.all([
    db.daily.where('date').between(periodStart, periodEnd + 'Z').toArray(),
    db.blood.where('date').between(periodStart, periodEnd + 'Z').toArray(),
    db.chemo.where('date').between(periodStart, periodEnd + 'Z').toArray(),
    db.wearable.where('date').between(periodStart, periodEnd + 'Z').toArray(),
    db.supplements.where('date').between(periodStart, periodEnd + 'Z').toArray(),
  ]);

  return {
    patient,
    daily: daily.sort((a, b) => a.date.localeCompare(b.date)),
    blood: blood.sort((a, b) => a.date.localeCompare(b.date)),
    chemo: chemo.sort((a, b) => a.date.localeCompare(b.date)),
    wearable: wearable.sort((a, b) => a.date.localeCompare(b.date)),
    supplements: supplements.sort((a, b) => a.date.localeCompare(b.date)),
    periodStart,
    periodEnd,
  };
}

// ==================== PDF GENERATION ====================

export async function generateReportPDF(daysBack = 30): Promise<void> {
  const data = await loadReportData(daysBack);
  if (!data) {
    alert('Brak danych pacjenta. Uzupełnij profil w ustawieniach.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== HEADER =====
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AlpacaLive — Raport dla lekarza', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, margin, y);
  doc.text(`Okres: ${formatDate(data.periodStart)} — ${formatDate(data.periodEnd)}`, margin + 80, y);
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setTextColor(0, 0, 0);

  // ===== PATIENT INFO =====
  y = sectionTitle(doc, 'Dane pacjenta', margin, y);
  const patientInfo = [
    `Pseudonim: ${data.patient.displayName}`,
    `Wiek: ${data.patient.age || '—'}`,
    `Diagnoza: ${data.patient.diagnosis || '—'}, stadium ${data.patient.stage || '—'}`,
    `Schemat chemii: ${data.patient.currentChemo || '—'}`,
    `Cykl: ${data.patient.chemoCycle || '—'}`,
  ];
  const activeMeds = [
    ...data.patient.oncologyMeds.filter(m => m.active).map(m => `${m.name} ${m.dose}`),
    ...data.patient.psychiatricMeds.filter(m => m.active).map(m => `${m.name} ${m.dose}`),
    ...data.patient.otherMeds.filter(m => m.active).map(m => `${m.name} ${m.dose}`),
  ];
  if (activeMeds.length > 0) patientInfo.push(`Leki: ${activeMeds.join(', ')}`);

  doc.setFontSize(9);
  for (const line of patientInfo) {
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 3;

  // ===== CURRENT PHASE =====
  const phaseInfo = calculateCurrentPhase(data.chemo.filter(c => c.status === 'completed'), data.patient.chemoCycle);
  if (phaseInfo.phase) {
    y = sectionTitle(doc, 'Aktualna faza cyklu', margin, y);
    doc.setFontSize(9);
    doc.text(`${getPhaseLabel(phaseInfo.phase)} (dzien ${phaseInfo.dayInCycle} cyklu)`, margin, y);
    y += 4.5;
    doc.text(phaseInfo.description, margin, y);
    y += 7;
  }

  // ===== CHEMO SESSIONS =====
  if (data.chemo.length > 0) {
    y = checkPageBreak(doc, y, 30, margin);
    y = sectionTitle(doc, `Sesje chemii (${data.chemo.length})`, margin, y);
    doc.setFontSize(8);
    for (const session of data.chemo) {
      const status = session.status === 'completed' ? '' : ` [${session.status}]`;
      doc.text(`${formatDate(session.actualDate || session.date)} — cykl ${session.cycle}, ${session.drugs.join(', ')}${status}`, margin + 2, y);
      y += 4;
    }
    y += 3;
  }

  // ===== ENERGY / PAIN / MOOD TRENDS =====
  if (data.daily.length > 0) {
    y = checkPageBreak(doc, y, 50, margin);
    y = sectionTitle(doc, 'Trendy samopoczucia', margin, y);

    // Mini table
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const cols = ['Data', 'Energia', 'Bol', 'Nudnosci', 'Nastroj', 'Waga'];
    const colWidths = [25, 18, 18, 18, 18, 18];
    let cx = margin;
    for (let i = 0; i < cols.length; i++) {
      doc.text(cols[i], cx, y);
      cx += colWidths[i];
    }
    y += 1;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    for (const d of data.daily.slice(-14)) {
      cx = margin;
      const vals = [
        formatDate(d.date),
        `${d.energy}/10`,
        `${d.pain}/10`,
        `${d.nausea}/10`,
        `${d.mood}/10`,
        d.weight ? `${d.weight} kg` : '—',
      ];
      for (let i = 0; i < vals.length; i++) {
        doc.text(vals[i], cx, y);
        cx += colWidths[i];
      }
      y += 3.5;
      y = checkPageBreak(doc, y, 10, margin);
    }

    // Averages
    const avgEnergy = avg(data.daily.map(d => d.energy));
    const avgPain = avg(data.daily.map(d => d.pain));
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text(`Srednie: energia ${avgEnergy.toFixed(1)}/10, bol ${avgPain.toFixed(1)}/10`, margin, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  }

  // ===== WEIGHT TREND =====
  const weightsWithDate = data.daily.filter(d => d.weight);
  if (weightsWithDate.length >= 2) {
    y = checkPageBreak(doc, y, 15, margin);
    y = sectionTitle(doc, 'Trend wagi', margin, y);
    const first = weightsWithDate[0];
    const last = weightsWithDate[weightsWithDate.length - 1];
    const diff = (last.weight! - first.weight!).toFixed(1);
    const sign = parseFloat(diff) >= 0 ? '+' : '';
    doc.setFontSize(9);
    doc.text(`${formatDate(first.date)}: ${first.weight} kg -> ${formatDate(last.date)}: ${last.weight} kg (${sign}${diff} kg)`, margin, y);
    y += 4.5;
    if (parseFloat(diff) < -2) {
      doc.setTextColor(200, 50, 50);
      doc.text('UWAGA: Spadek wagi >2 kg w okresie raportu', margin, y);
      doc.setTextColor(0, 0, 0);
      y += 4.5;
    }
    y += 3;
  }

  // ===== BLOOD WORK =====
  if (data.blood.length > 0) {
    y = checkPageBreak(doc, y, 40, margin);
    y = sectionTitle(doc, `Wyniki krwi (${data.blood.length} badan)`, margin, y);

    for (const bw of data.blood) {
      y = checkPageBreak(doc, y, 25, margin);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Badanie z ${formatDate(bw.date)}${bw.lab ? ` (${bw.lab})` : ''}`, margin, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      const markers = Object.entries(bw.markers);
      for (const [key, value] of markers) {
        const norm = BLOOD_NORMS[key];
        const status = evaluateMarker(key, value);
        const statusLabel = status === 'normal' ? '' : status === 'critical_low' ? ' !! KRYT. NISKI' : status === 'critical_high' ? ' !! KRYT. WYSOKI' : status === 'low' ? ' (nizej normy)' : ' (powyzej normy)';

        if (status.includes('critical')) {
          doc.setTextColor(200, 50, 50);
        } else if (status !== 'normal') {
          doc.setTextColor(200, 150, 0);
        }

        const name = norm?.name || key;
        const unit = norm?.unit || '';
        const range = norm ? `[${norm.normalMin}–${norm.normalMax}]` : '';

        doc.text(`${name}: ${value} ${unit} ${range}${statusLabel}`, margin + 2, y);
        doc.setTextColor(0, 0, 0);
        y += 3.5;
        y = checkPageBreak(doc, y, 10, margin);
      }
      y += 3;
    }
  }

  // ===== RHR / HRV FROM WEARABLE =====
  if (data.wearable.length > 0) {
    y = checkPageBreak(doc, y, 25, margin);
    y = sectionTitle(doc, 'Dane z opaski (RHR / HRV / SpO2)', margin, y);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Data          RHR     HRV     SpO2    Kroki', margin, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    for (const w of data.wearable.slice(-10)) {
      doc.text(`${formatDate(w.date)}    ${w.rhr}bpm   ${w.hrv}ms   ${w.spo2}%    ${w.steps}`, margin, y);
      y += 3.5;
      y = checkPageBreak(doc, y, 10, margin);
    }
    y += 3;
  }

  // ===== ALERTS =====
  const alerts = generateAlerts(data);
  if (alerts.length > 0) {
    y = checkPageBreak(doc, y, 20, margin);
    y = sectionTitle(doc, 'Alerty i nieprawidlowosci', margin, y);
    doc.setFontSize(8);
    for (const alert of alerts) {
      doc.setTextColor(alert.critical ? 200 : 180, alert.critical ? 50 : 120, alert.critical ? 50 : 0);
      doc.text(`${alert.critical ? '!!' : '!'} ${alert.text}`, margin + 2, y);
      doc.setTextColor(0, 0, 0);
      y += 4;
      y = checkPageBreak(doc, y, 10, margin);
    }
    y += 3;
  }

  // ===== SUPPLEMENTS =====
  if (data.supplements.length > 0) {
    y = checkPageBreak(doc, y, 20, margin);
    y = sectionTitle(doc, 'Suplementacja', margin, y);
    doc.setFontSize(8);
    const latestSupp = data.supplements[data.supplements.length - 1];
    for (const s of latestSupp.supplements) {
      doc.text(`${s.taken ? '[x]' : '[ ]'} ${s.name} ${s.dose}${s.time ? ` (${s.time})` : ''}`, margin + 2, y);
      y += 4;
    }
    y += 3;
  }

  // ===== QUESTIONS FOR DOCTOR =====
  y = checkPageBreak(doc, y, 30, margin);
  y = sectionTitle(doc, 'Sugerowane pytania do lekarza', margin, y);
  doc.setFontSize(8);
  const questions = generateDoctorQuestions(data);
  for (const q of questions) {
    doc.text(`- ${q}`, margin + 2, y);
    y += 4.5;
    y = checkPageBreak(doc, y, 10, margin);
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `AlpacaLive — raport wygenerowany automatycznie | str. ${i}/${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.text(
      'Dane pochodza z samoobserwacji pacjenta. Do interpretacji przez lekarza.',
      margin,
      doc.internal.pageSize.getHeight() - 4,
    );
  }

  // ===== SAVE =====
  const filename = `AlpacaLive-raport-${data.periodEnd}.pdf`;
  doc.save(filename);
}

// ==================== HELPERS ====================

function sectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(61, 79, 79); // accent-dark
  doc.text(title, x, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return y + 6;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, margin: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 15) {
    doc.addPage();
    return margin;
  }
  return y;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ==================== ALERTS ====================

interface Alert {
  text: string;
  critical: boolean;
}

function generateAlerts(data: ReportData): Alert[] {
  const alerts: Alert[] = [];

  // Blood alerts
  for (const bw of data.blood) {
    for (const [key, value] of Object.entries(bw.markers)) {
      const status = evaluateMarker(key, value);
      const norm = BLOOD_NORMS[key];
      if (status.includes('critical')) {
        alerts.push({ text: `${formatDate(bw.date)}: ${norm?.name || key} = ${value} ${norm?.unit || ''} — wartość krytyczna`, critical: true });
      } else if (status !== 'normal') {
        alerts.push({ text: `${formatDate(bw.date)}: ${norm?.name || key} = ${value} ${norm?.unit || ''} — poza normą`, critical: false });
      }
    }
  }

  // Weight alert
  const weights = data.daily.filter(d => d.weight);
  if (weights.length >= 2) {
    const first = weights[0].weight!;
    const last = weights[weights.length - 1].weight!;
    if (last - first < -2) {
      alerts.push({ text: `Spadek wagi ${(first - last).toFixed(1)} kg w okresie raportu`, critical: true });
    }
  }

  // Energy alert
  const lowEnergy = data.daily.filter(d => d.energy <= 2);
  if (lowEnergy.length >= 3) {
    alerts.push({ text: `${lowEnergy.length} dni z energia <= 2/10`, critical: false });
  }

  // SpO2 alert
  const lowSpo2 = data.wearable.filter(w => w.spo2 < 94);
  if (lowSpo2.length > 0) {
    alerts.push({ text: `${lowSpo2.length} pomiarów SpO2 < 94%`, critical: true });
  }

  // High RHR alert
  const highRhr = data.wearable.filter(w => w.rhr > 85);
  if (highRhr.length >= 3) {
    alerts.push({ text: `${highRhr.length} dni z RHR > 85 bpm — możliwa infekcja/odwodnienie`, critical: false });
  }

  return alerts;
}

// ==================== DOCTOR QUESTIONS ====================

function generateDoctorQuestions(data: ReportData): string[] {
  const questions: string[] = [];

  // Based on blood work
  const latestBlood = data.blood[data.blood.length - 1];
  if (latestBlood) {
    const wbc = latestBlood.markers.wbc;
    const hgb = latestBlood.markers.hgb;
    const plt = latestBlood.markers.plt;

    if (wbc !== undefined && wbc < 3) {
      questions.push('Czy wskazane jest podanie G-CSF (filgrastym) przy niskich leukocytach?');
    }
    if (hgb !== undefined && hgb < 9) {
      questions.push('Czy rozważa Pan/Pani erytropoetynę lub transfuzję przy niskiej hemoglobinie?');
    }
    if (plt !== undefined && plt < 80) {
      questions.push('Czy niskie płytki wymagają modyfikacji dawki chemii?');
    }
  }

  // Weight
  const weights = data.daily.filter(d => d.weight);
  if (weights.length >= 2) {
    const diff = weights[weights.length - 1].weight! - weights[0].weight!;
    if (diff < -2) {
      questions.push('Spadek wagi — czy wskazana konsultacja dietetyczna lub żywienie wspomagające?');
    }
  }

  // Neuropathy
  const neuropathy = data.daily.filter(d => d.neuropathy >= 2);
  if (neuropathy.length > 3) {
    questions.push('Neuropatia utrzymuje się — czy rozważyć redukcję dawki lub zmianę schematu?');
  }

  // Pain
  const highPain = data.daily.filter(d => d.pain >= 6);
  if (highPain.length > 3) {
    questions.push('Częsty silny ból — czy potrzebna modyfikacja leczenia przeciwbólowego?');
  }

  // General
  if (data.chemo.length > 0) {
    questions.push('Czy obecny schemat chemii jest optymalny na podstawie dotychczasowej odpowiedzi?');
  }
  questions.push('Kiedy zalecane następne badanie obrazowe (CT/PET)?');

  return questions.slice(0, 8);
}
