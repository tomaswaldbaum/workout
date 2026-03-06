import type { Exercise } from '../types';

export function formatRepsDisplay(exercise: Exercise): string {
  const unit = exercise.repsUnit === 'seconds' ? 's' : exercise.repsUnit === 'meters' ? 'm' : '';
  const reps =
    exercise.repsMin === exercise.repsMax
      ? `${exercise.repsMin}${unit}`
      : `${exercise.repsMin}-${exercise.repsMax}${unit}`;
  const side = exercise.perSide ? '/lado' : '';
  const hold = exercise.holdSeconds ? ` (${exercise.holdSeconds}s hold)` : '';
  return `${exercise.sets} × ${reps}${side}${hold}`;
}

export function formatRestTime(seconds: number, maxSeconds?: number): string {
  if (seconds <= 0) return '';
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${m}:00`;
  };
  if (maxSeconds && maxSeconds !== seconds) {
    return `${fmt(seconds)}-${fmt(maxSeconds)}`;
  }
  return fmt(seconds);
}

export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDateShort(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export function formatDateFull(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
}
