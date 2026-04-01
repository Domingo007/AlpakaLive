import type { TumorMeasurement } from '@/types';

export type RecistResponse = 'CR' | 'PR' | 'SD' | 'PD';

export function calculateRecistResponse(
  currentTumors: TumorMeasurement[],
  previousTumors: TumorMeasurement[],
): RecistResponse {
  if (currentTumors.length === 0 && previousTumors.length > 0) return 'CR';
  if (previousTumors.length === 0) return 'SD';

  const currentSum = currentTumors.reduce((sum, t) => sum + (t.sizeMm[0] || 0), 0);
  const previousSum = previousTumors.reduce((sum, t) => sum + (t.sizeMm[0] || 0), 0);

  if (currentSum === 0) return 'CR';

  const changePercent = ((currentSum - previousSum) / previousSum) * 100;

  if (changePercent <= -30) return 'PR';
  if (changePercent >= 20) {
    const absoluteIncrease = currentSum - previousSum;
    if (absoluteIncrease >= 5) return 'PD';
  }
  return 'SD';
}

export function getRecistLabel(response: RecistResponse): string {
  switch (response) {
    case 'CR': return 'Calkowita odpowiedz';
    case 'PR': return 'Czesciowa odpowiedz';
    case 'SD': return 'Stabilna choroba';
    case 'PD': return 'Progresja';
  }
}

export function getRecistColor(response: RecistResponse): string {
  switch (response) {
    case 'CR': return '#27ae60';
    case 'PR': return '#3498db';
    case 'SD': return '#f39c12';
    case 'PD': return '#e74c3c';
  }
}

export function calculateTumorVolume(sizeMm: number[]): number {
  if (sizeMm.length === 3) {
    return (4 / 3) * Math.PI * (sizeMm[0] / 2) * (sizeMm[1] / 2) * (sizeMm[2] / 2);
  }
  if (sizeMm.length === 2) {
    return Math.PI * (sizeMm[0] / 2) * (sizeMm[1] / 2);
  }
  return sizeMm[0] || 0;
}

export function calculateChangePercent(current: number[], previous: number[]): number {
  const currentLongest = Math.max(...current);
  const previousLongest = Math.max(...previous);
  if (previousLongest === 0) return 0;
  return ((currentLongest - previousLongest) / previousLongest) * 100;
}
