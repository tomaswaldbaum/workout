// ==========================================
// Routine Structure (Static Data)
// ==========================================

export interface Routine {
  id?: number;
  name: string;
  description: string;
}

export interface RoutineDay {
  id?: number;
  routineId: number;
  dayNumber: number;
  name: string;
  focus: string;
  totalDuration: number;
}

export interface Block {
  id?: number;
  dayId: number;
  name: string;
  order: number;
  duration: number;
  objective: string;
  type: 'warmup' | 'main' | 'core';
  notes?: string;
  executionMode?: 'sequential' | 'superset';
  executionOrder?: string;
}

export interface Exercise {
  id?: number;
  blockId: number;
  name: string;
  order: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  repsUnit: 'reps' | 'seconds' | 'meters';
  rir?: string;
  restSeconds: number;
  restSecondsMax?: number;
  weight?: number;
  weightUnit?: string;
  isOptional: boolean;
  notes?: string;
  supersetTag?: string;
  coachingTips?: string;
  holdSeconds?: number;
  perSide?: boolean;
  tempo?: string;
  videoUrl?: string;
}

// ==========================================
// Tracking (Dynamic Data)
// ==========================================

export interface WorkoutSession {
  id?: number;
  dayId: number;
  routineId: number;
  date: Date;
  status: 'in-progress' | 'completed' | 'abandoned';
  startedAt: Date;
  finishedAt?: Date;
  notes?: string;
}

export interface SetLog {
  id?: number;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  completed: boolean;
  actualReps?: number;
  actualWeight?: number;
  completedAt?: Date;
  skipped?: boolean;
}
