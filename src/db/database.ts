import Dexie, { type Table } from 'dexie';
import type { Routine, RoutineDay, Block, Exercise, WorkoutSession, SetLog } from '../types';

export class WorkoutDB extends Dexie {
  routines!: Table<Routine, number>;
  routineDays!: Table<RoutineDay, number>;
  blocks!: Table<Block, number>;
  exercises!: Table<Exercise, number>;
  workoutSessions!: Table<WorkoutSession, number>;
  setLogs!: Table<SetLog, number>;

  constructor() {
    super('WorkoutTrackerDB');
    this.version(1).stores({
      routines: '++id',
      routineDays: '++id, routineId, dayNumber',
      blocks: '++id, dayId, order',
      exercises: '++id, blockId, order',
      workoutSessions: '++id, dayId, routineId, status, date',
      setLogs: '++id, sessionId, exerciseId, setNumber',
    });
    this.version(2).stores({
      routines: '++id',
      routineDays: '++id, routineId, dayNumber',
      blocks: '++id, dayId, order',
      exercises: '++id, blockId, order',
      workoutSessions: '++id, dayId, routineId, status, date',
      setLogs: '++id, sessionId, exerciseId, setNumber',
    });
    this.version(3).stores({
      routines: '++id',
      routineDays: '++id, routineId, dayNumber',
      blocks: '++id, dayId, order',
      exercises: '++id, blockId, order',
      workoutSessions: '++id, dayId, routineId, status, date',
      setLogs: '++id, sessionId, exerciseId, setNumber',
    });
  }
}

export const db = new WorkoutDB();
