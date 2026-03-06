import { db } from './database';
import type { Exercise } from '../types';

type ExerciseSeed = Omit<Exercise, 'id' | 'blockId'>;

// ─── Shared Core Blocks (identical for all 4 days) ────────────────────────

const CORE_BLOCK_1: ExerciseSeed[] = [
  { name: 'McGill Curl-up', order: 1, sets: 2, repsMin: 6, repsMax: 6, repsUnit: 'reps', restSeconds: 25, holdSeconds: 10, isOptional: false, notes: 'Cada rep = 10s hold. Calidad máxima, sin apuro.', videoUrl: 'https://youtube.com/shorts/ORxHOWsqMSo' },
  { name: 'Side Plank', order: 2, sets: 2, repsMin: 20, repsMax: 35, repsUnit: 'seconds', restSeconds: 25, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/qlIqmRk89u0' },
  { name: 'Bird Dog', order: 3, sets: 2, repsMin: 6, repsMax: 6, repsUnit: 'reps', restSeconds: 25, holdSeconds: 5, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/k2azbUMi3yg' },
  { name: 'Dead Bug', order: 4, sets: 1, repsMin: 6, repsMax: 10, repsUnit: 'reps', restSeconds: 0, perSide: true, isOptional: true, notes: 'Slow. Solo si todo se siente estable.', videoUrl: 'https://youtube.com/shorts/5pEsUJaomvk' },
];

const CORE_BLOCK_2: ExerciseSeed[] = [
  { name: 'Pallof Press', order: 1, sets: 3, repsMin: 10, repsMax: 15, repsUnit: 'reps', restSeconds: 30, restSecondsMax: 45, holdSeconds: 2, perSide: true, isOptional: false, notes: 'Hold 2s en cada rep.', videoUrl: 'https://youtube.com/shorts/Hy43_b5aEOc' },
  { name: 'Suitcase Carry', order: 2, sets: 3, repsMin: 20, repsMax: 40, repsUnit: 'meters', restSeconds: 30, restSecondsMax: 45, perSide: true, isOptional: false, notes: 'Si no hay espacio: suitcase hold 25-40s/lado.', videoUrl: 'https://youtube.com/shorts/0XmMAp8zknQ' },
  { name: 'RKC Plank', order: 3, sets: 1, repsMin: 15, repsMax: 25, repsUnit: 'seconds', restSeconds: 0, isOptional: true, notes: 'Solo si no genera tensión lumbar. 1-2 sets.', videoUrl: 'https://youtube.com/shorts/3H5l3M_1D4o' },
];

async function addCoreBlocks(dayId: number) {
  const c1 = await db.blocks.add({
    dayId, name: 'Core Bloque 1 — McGill Big 3', order: 5, duration: 10,
    objective: 'Rigidez/control del tronco. Calidad máxima, sin apuro, técnica perfecta.', type: 'core',
    executionMode: 'sequential', executionOrder: 'McGill Curl-up → Side Plank → Bird Dog (todos los sets de cada uno antes de pasar al siguiente)',
  });
  await db.exercises.bulkAdd(CORE_BLOCK_1.map(e => ({ ...e, blockId: c1 })));

  const c2 = await db.blocks.add({
    dayId, name: 'Core Bloque 2 — Anti-rotación + Anti-side bend', order: 6, duration: 10,
    objective: 'Transfer al gym. Anti-rotación + anti-side bend.', type: 'core',
    executionMode: 'sequential', executionOrder: 'Pallof Press (todos los sets) → Suitcase Carry (todos los sets)',
  });
  await db.exercises.bulkAdd(CORE_BLOCK_2.map(e => ({ ...e, blockId: c2 })));
}

// ─── DAY 1: Upper Push A ──────────────────────────────────────────────────

async function seedDay1(routineId: number) {
  const dayId = await db.routineDays.add({
    routineId, dayNumber: 1, name: 'Upper Push A',
    focus: 'Pecho / Tríceps / Deltoides anterior', totalDuration: 90,
  });

  // Warm-up
  const w = await db.blocks.add({
    dayId, name: 'Warm-up', order: 0, duration: 10,
    objective: 'Preparar hombros/escápulas + activar brace sin fatigar.', type: 'warmup',
    executionMode: 'sequential',
  });
  await db.exercises.bulkAdd([
    { blockId: w, name: 'Breathing + brace (ribs down)', order: 1, sets: 1, repsMin: 90, repsMax: 90, repsUnit: 'seconds', restSeconds: 0, isOptional: false, videoUrl: 'https://youtube.com/shorts/ixkUbEfSMVk' },
    { blockId: w, name: 'Scap push-ups', order: 2, sets: 2, repsMin: 8, repsMax: 10, repsUnit: 'reps', restSeconds: 30, isOptional: false, videoUrl: 'https://youtube.com/shorts/vkGjGnRvfzc' },
    { blockId: w, name: 'Band pull-aparts / Face pulls', order: 3, sets: 2, repsMin: 15, repsMax: 20, repsUnit: 'reps', rir: '4', restSeconds: 30, isOptional: false, videoUrl: 'https://youtube.com/shorts/icNTMSPBvJw' },
    { blockId: w, name: 'Rotaciones torácicas', order: 4, sets: 2, repsMin: 6, repsMax: 6, repsUnit: 'reps', restSeconds: 30, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/7Bqq3_JKl3Q' },
    { blockId: w, name: 'Ramp-up Bench Press', order: 5, sets: 3, repsMin: 3, repsMax: 12, repsUnit: 'reps', restSeconds: 30, isOptional: false, notes: 'Set 1: Barra sola ×10-12 | Set 2: Liviano ×6-8 | Set 3: Moderado ×3-5', videoUrl: 'https://youtube.com/shorts/0cXAp6WhSj4' },
  ]);

  // Block A — Bench principal
  const a = await db.blocks.add({
    dayId, name: 'Bloque A — Bench Principal', order: 1, duration: 20,
    objective: 'Estímulo principal de pecho/tríceps/deltoides anterior con técnica limpia.', type: 'main',
    executionMode: 'sequential', executionOrder: 'Bench Press: Set 1 → 2 → 3 → 4, luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: a, name: 'Barbell Bench Press', order: 1, sets: 4, repsMin: 10, repsMax: 10, repsUnit: 'reps', rir: '1-2', restSeconds: 120, restSecondsMax: 180, weight: 47.5, weightUnit: 'kg', isOptional: false, coachingTips: 'Arco leve natural, no "puente". Ribs down (sin sacar costillas). Leg drive = estabilidad, no extensión lumbar. Cero grinders.', videoUrl: 'https://youtube.com/shorts/0cXAp6WhSj4' },
    { blockId: a, name: 'Back-off técnico', order: 2, sets: 1, repsMin: 12, repsMax: 12, repsUnit: 'reps', rir: '2', restSeconds: 0, weight: 45, weightUnit: 'kg', isOptional: true, tempo: '2-3s bajada, pausa suave sin rebotar', notes: 'Si la lumbar está sensible hoy: saltá el opcional.', videoUrl: 'https://youtube.com/shorts/0cXAp6WhSj4' },
  ]);

  // Block B — Superset pecho + espalda
  const b = await db.blocks.add({
    dayId, name: 'Bloque B — Superset Pecho + Espalda', order: 2, duration: 20,
    objective: 'Volumen de pecho sin castigar articulaciones + espalda para hombros sanos.', type: 'main',
    notes: '4 rondas (A1 → A2)',
    executionMode: 'superset', executionOrder: 'B1 Incline DB Bench → B2 Chest-Supported Row por ronda (×4), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: b, name: 'Incline DB Bench Press', order: 1, sets: 4, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, isOptional: false, supersetTag: 'A', coachingTips: 'Brace suave + ribs down (sin compensar lumbar).', videoUrl: 'https://youtube.com/shorts/8nNi8jbbUPE' },
    { blockId: b, name: 'Chest-Supported DB Row', order: 2, sets: 4, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '1-2', restSeconds: 60, restSecondsMax: 75, isOptional: false, supersetTag: 'A', coachingTips: 'Hombros lejos de orejas, 1s squeeze arriba, bajada controlada.', videoUrl: 'https://youtube.com/shorts/pYcpY20QaE8' },
    { blockId: b, name: 'Incline Rear Delt Raise', order: 3, sets: 2, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '2', restSeconds: 30, restSecondsMax: 45, isOptional: true, notes: 'Pecho apoyado. Refuerza balance del hombro sin sumar mucha fatiga.', videoUrl: 'https://youtube.com/shorts/L0SZnOjmEOo' },
  ]);

  // Block C — Delts + tríceps
  const c = await db.blocks.add({
    dayId, name: 'Bloque C — Delts + Tríceps', order: 3, duration: 20,
    objective: 'Completar volumen de deltoides y tríceps con bajo costo lumbar.', type: 'main',
    executionMode: 'sequential', executionOrder: 'C1 Shoulder Press (todos los sets) → C2 Lateral Raise (todos) → C3 Pressdown (todos), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: c, name: 'Seated DB Shoulder Press', order: 1, sets: 3, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '2', restSeconds: 90, isOptional: false, coachingTips: 'Con respaldo si se puede. Si te arqueás para terminar reps → bajá peso o quedate más lejos del fallo.', videoUrl: 'https://youtube.com/shorts/Ej3o9y9JvFk' },
    { blockId: c, name: 'DB Lateral Raise', order: 2, sets: 4, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '1', restSeconds: 60, isOptional: false, notes: 'Ideal sentado. Última serie: fallo técnico permitido (sin balanceo ni arco lumbar).', videoUrl: 'https://youtube.com/shorts/v_ZkxWzYnAk' },
    { blockId: c, name: 'Triceps Pressdown', order: 3, sets: 3, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '1-2', restSeconds: 60, isOptional: false, videoUrl: 'https://youtube.com/shorts/2-LAMcpzODU' },
    { blockId: c, name: 'Face Pulls', order: 4, sets: 2, repsMin: 15, repsMax: 25, repsUnit: 'reps', rir: '3', restSeconds: 30, restSecondsMax: 45, isOptional: true, notes: 'Higiene escapular/rotadores. Liviano y controlado. Alt: Band external rotation 1-2×12-20/lado.', videoUrl: 'https://youtube.com/shorts/rep-qVOkqgk' },
  ]);

  await addCoreBlocks(dayId);
}

// ─── DAY 2: Upper Pull ────────────────────────────────────────────────────

async function seedDay2(routineId: number) {
  const dayId = await db.routineDays.add({
    routineId, dayNumber: 2, name: 'Upper Pull',
    focus: 'Espalda / Bíceps / Deltoides posterior', totalDuration: 90,
  });

  // Warm-up
  const w = await db.blocks.add({
    dayId, name: 'Warm-up', order: 0, duration: 10,
    objective: 'Preparar escápulas + activar brace + ramp-up remo.', type: 'warmup',
    executionMode: 'sequential',
  });
  await db.exercises.bulkAdd([
    { blockId: w, name: 'Breathing + brace', order: 1, sets: 1, repsMin: 60, repsMax: 60, repsUnit: 'seconds', restSeconds: 0, isOptional: false, videoUrl: 'https://youtube.com/shorts/ixkUbEfSMVk' },
    { blockId: w, name: 'Rotaciones torácicas', order: 2, sets: 2, repsMin: 6, repsMax: 6, repsUnit: 'reps', restSeconds: 30, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/7Bqq3_JKl3Q' },
    { blockId: w, name: 'External rotation (side-lying)', order: 3, sets: 1, repsMin: 15, repsMax: 20, repsUnit: 'reps', rir: '3', restSeconds: 30, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/W95bF0T8dMY' },
    { blockId: w, name: 'Serratus push-up plus', order: 4, sets: 1, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '3', restSeconds: 15, isOptional: false, videoUrl: 'https://youtube.com/shorts/ALzFr2GT-Is' },
    { blockId: w, name: 'Band pull-aparts / Face pulls', order: 5, sets: 1, repsMin: 15, repsMax: 20, repsUnit: 'reps', rir: '4', restSeconds: 15, isOptional: false, videoUrl: 'https://youtube.com/shorts/icNTMSPBvJw' },
    { blockId: w, name: 'Ramp-up Chest-Supported Row', order: 6, sets: 2, repsMin: 6, repsMax: 10, repsUnit: 'reps', restSeconds: 30, isOptional: false, notes: 'Set 1: Liviano ×10 | Set 2: Moderado ×6-8', videoUrl: 'https://youtube.com/shorts/pYcpY20QaE8' },
  ]);

  // Block A — Remo principal
  const a = await db.blocks.add({
    dayId, name: 'Bloque A — Remo Principal', order: 1, duration: 20,
    objective: 'Estímulo principal espalda media/lats con mínima carga lumbar.', type: 'main',
    executionMode: 'sequential', executionOrder: 'A1 Chest-Supported Row: Set 1 → 2 → 3 → 4, luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: a, name: 'Chest-Supported DB Row', order: 1, sets: 4, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '1-2', restSeconds: 90, restSecondsMax: 120, isOptional: false, coachingTips: 'Pecho pegado, hombros lejos de orejas, 1s squeeze arriba, bajada 2-3s.', videoUrl: 'https://youtube.com/shorts/pYcpY20QaE8' },
    { blockId: a, name: 'DB Pullover en banco', order: 2, sets: 2, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '2', restSeconds: 45, restSecondsMax: 60, isOptional: true, notes: 'Ribs down, no arco lumbar.', videoUrl: 'https://youtube.com/shorts/FK4rHfWKEac' },
  ]);

  // Block B — Lats vertical + rear delts superset
  const b = await db.blocks.add({
    dayId, name: 'Bloque B — Lats Vertical + Rear Delts', order: 2, duration: 20,
    objective: 'Lats + deltoide posterior + estabilidad escapular (protege hombro para bench).', type: 'main',
    notes: '4 rondas (B1 → B2)',
    executionMode: 'superset', executionOrder: 'B1 Pull-ups → B2 Rear Delt Raise por ronda (×4), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: b, name: 'Pull-ups / Chin-ups asistidas', order: 1, sets: 4, repsMin: 6, repsMax: 10, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, isOptional: false, supersetTag: 'B', notes: 'Alt: TRX Lat-biased Row 10-15 reps si no hay barra.', videoUrl: 'https://youtube.com/shorts/HRV5YKKaeVw' },
    { blockId: b, name: 'Incline Rear Delt Raise', order: 2, sets: 4, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, isOptional: false, supersetTag: 'B', notes: 'Pecho apoyado.', videoUrl: 'https://youtube.com/shorts/L0SZnOjmEOo' },
    { blockId: b, name: 'Face Pulls', order: 3, sets: 2, repsMin: 15, repsMax: 25, repsUnit: 'reps', rir: '3', restSeconds: 30, restSecondsMax: 45, isOptional: true, videoUrl: 'https://youtube.com/shorts/rep-qVOkqgk' },
  ]);

  // Block C — Remo unilateral + bíceps
  const c = await db.blocks.add({
    dayId, name: 'Bloque C — Remo Unilateral + Bíceps', order: 3, duration: 20,
    objective: 'Simetría/lat unilateral + bíceps sin trampa lumbar.', type: 'main',
    notes: '3 rondas (C1 → C2)',
    executionMode: 'superset', executionOrder: 'C1 1-Arm Row (lado A → lado B) → C2 Curl por ronda (×3), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: c, name: '1-Arm DB Row', order: 1, sets: 3, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, perSide: true, isOptional: false, supersetTag: 'C', notes: '15-20s descanso entre lados. Apoyado en banco.', videoUrl: 'https://youtube.com/shorts/roCP6wCXPqo' },
    { blockId: c, name: 'DB Alternating Curl', order: 2, sets: 3, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '1-2', restSeconds: 60, restSecondsMax: 75, isOptional: false, supersetTag: 'C', notes: 'Supinando.', videoUrl: 'https://youtube.com/shorts/sAq_ocpRh_I' },
    { blockId: c, name: 'Hammer Curl', order: 3, sets: 2, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '0-1', restSeconds: 60, isOptional: true, videoUrl: 'https://youtube.com/shorts/zC3nLlEvin4' },
  ]);

  await addCoreBlocks(dayId);
}

// ─── DAY 3: Upper Push B ──────────────────────────────────────────────────

async function seedDay3(routineId: number) {
  const dayId = await db.routineDays.add({
    routineId, dayNumber: 3, name: 'Upper Push B',
    focus: 'Pecho (volumen) / Delts / Brazos', totalDuration: 90,
  });

  // Warm-up
  const w = await db.blocks.add({
    dayId, name: 'Warm-up', order: 0, duration: 10,
    objective: 'Preparar hombros/escápulas + activar brace + entrar al bench estable.', type: 'warmup',
    executionMode: 'sequential',
  });
  await db.exercises.bulkAdd([
    { blockId: w, name: 'Breathing + brace (ribs down)', order: 1, sets: 1, repsMin: 60, repsMax: 60, repsUnit: 'seconds', restSeconds: 0, isOptional: false, videoUrl: 'https://youtube.com/shorts/ixkUbEfSMVk' },
    { blockId: w, name: 'Rotaciones torácicas', order: 2, sets: 2, repsMin: 6, repsMax: 6, repsUnit: 'reps', restSeconds: 30, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/7Bqq3_JKl3Q' },
    { blockId: w, name: 'Scap push-ups', order: 3, sets: 1, repsMin: 8, repsMax: 10, repsUnit: 'reps', restSeconds: 15, isOptional: false, notes: 'Controladas.', videoUrl: 'https://youtube.com/shorts/vkGjGnRvfzc' },
    { blockId: w, name: 'Side-lying DB external rotation', order: 4, sets: 1, repsMin: 15, repsMax: 20, repsUnit: 'reps', rir: '3', restSeconds: 15, perSide: true, isOptional: false, notes: 'Liviano. Alternás lados sin descanso largo.', videoUrl: 'https://youtube.com/shorts/W95bF0T8dMY' },
    { blockId: w, name: 'Band pull-aparts / Face pulls', order: 5, sets: 1, repsMin: 15, repsMax: 20, repsUnit: 'reps', rir: '4', restSeconds: 15, isOptional: false, videoUrl: 'https://youtube.com/shorts/icNTMSPBvJw' },
    { blockId: w, name: 'Ramp-up Bench Press', order: 6, sets: 3, repsMin: 3, repsMax: 12, repsUnit: 'reps', restSeconds: 30, isOptional: false, notes: 'Set 1: Barra sola ×10-12 | Set 2: Liviano ×6-8 | Set 3: Moderado ×3-5', videoUrl: 'https://youtube.com/shorts/0cXAp6WhSj4' },
  ]);

  // Block A — Bench volumen
  const a = await db.blocks.add({
    dayId, name: 'Bloque A — Bench Volumen', order: 1, duration: 20,
    objective: 'Sumar volumen de pecho/tríceps sin el costo de fatiga del Día 1.', type: 'main',
    executionMode: 'sequential', executionOrder: 'Bench Press: Set 1 → 2 → 3 → 4, luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: a, name: 'Barbell Bench Press', order: 1, sets: 4, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '1-2', restSeconds: 120, restSecondsMax: 150, weight: 45, weightUnit: 'kg', isOptional: false, coachingTips: 'Arco leve natural, ribs down, leg drive = estabilidad. Sin grinders. Si fatigado → 42.5 kg.', notes: '45 kg si te sentís bien, 42.5 kg si estás más fatigado.', videoUrl: 'https://youtube.com/shorts/0cXAp6WhSj4' },
    { blockId: a, name: 'Bench técnico', order: 2, sets: 1, repsMin: 10, repsMax: 10, repsUnit: 'reps', rir: '2', restSeconds: 0, isOptional: true, notes: 'Pausa 1s en el pecho o excéntrica 3s. Más estímulo sin subir carga.', videoUrl: 'https://youtube.com/shorts/0cXAp6WhSj4' },
  ]);

  // Block B — Superset pecho + espalda
  const b = await db.blocks.add({
    dayId, name: 'Bloque B — Superset Pecho + Espalda', order: 2, duration: 20,
    objective: 'Más volumen de pecho + espalda para proteger hombros y mejorar bench.', type: 'main',
    notes: '4 rondas (B1 → B2)',
    executionMode: 'superset', executionOrder: 'B1 Incline DB Bench → B2 Chest-Supported Row por ronda (×4), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: b, name: 'Incline DB Bench Press', order: 1, sets: 4, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, isOptional: false, supersetTag: 'B', coachingTips: 'Brace suave + ribs down.', videoUrl: 'https://youtube.com/shorts/8nNi8jbbUPE' },
    { blockId: b, name: 'Chest-Supported DB Row', order: 2, sets: 4, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '1-2', restSeconds: 60, restSecondsMax: 75, isOptional: false, supersetTag: 'B', coachingTips: 'Hombros lejos de orejas, 1s squeeze, bajada controlada 2-3s.', videoUrl: 'https://youtube.com/shorts/pYcpY20QaE8' },
    { blockId: b, name: 'Incline Rear Delt Raise', order: 3, sets: 2, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '2', restSeconds: 30, restSecondsMax: 45, isOptional: true, notes: 'Pecho apoyado. Higiene del hombro, cero costo lumbar.', videoUrl: 'https://youtube.com/shorts/L0SZnOjmEOo' },
  ]);

  // Block C — Delts + brazos
  const c = await db.blocks.add({
    dayId, name: 'Bloque C — Delts + Brazos', order: 3, duration: 20,
    objective: 'Completar hipertrofia de deltoides y brazos sin destruirte antes del core.', type: 'main',
    executionMode: 'sequential', executionOrder: 'C1 Lateral Raise (todos los sets) → C2 Triceps Extension (todos) → C3 Hammer Curl (todos), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: c, name: 'DB Lateral Raise', order: 1, sets: 4, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '1', restSeconds: 60, isOptional: false, notes: 'Ideal sentado. Última serie: fallo técnico permitido (sin balanceo ni arco lumbar).', videoUrl: 'https://youtube.com/shorts/v_ZkxWzYnAk' },
    { blockId: c, name: 'Triceps Overhead Extension (DB)', order: 2, sets: 3, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '1-2', restSeconds: 60, restSecondsMax: 75, isOptional: false, coachingTips: 'Ribs down, codos estables. Si overhead hace arquear → cable pressdown.', notes: 'Alt: Cable pressdown si overhead te hace arquear.', videoUrl: 'https://youtube.com/shorts/YbX7Wd8jQ-Q' },
    { blockId: c, name: 'Hammer Curl', order: 3, sets: 2, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '0-1', restSeconds: 60, restSecondsMax: 75, isOptional: false, coachingTips: 'Sin swing, bajada controlada 2-3s.', videoUrl: 'https://youtube.com/shorts/zC3nLlEvin4' },
    { blockId: c, name: 'Face Pulls / External rotations', order: 4, sets: 2, repsMin: 15, repsMax: 25, repsUnit: 'reps', rir: '3', restSeconds: 30, restSecondsMax: 45, isOptional: true, notes: 'Elegí uno. Liviano. Alt: External rotations 1×15-20/lado.', videoUrl: 'https://youtube.com/shorts/rep-qVOkqgk' },
  ]);

  await addCoreBlocks(dayId);
}

// ─── DAY 4: Lower / Glutes ───────────────────────────────────────────────

async function seedDay4(routineId: number) {
  const dayId = await db.routineDays.add({
    routineId, dayNumber: 4, name: 'Lower / Glutes',
    focus: 'Glúteos / Cuádriceps / Isquios / Pantorrillas', totalDuration: 90,
  });

  // Warm-up
  const w = await db.blocks.add({
    dayId, name: 'Warm-up', order: 0, duration: 10,
    objective: 'Preparar caderas/aductores/glúteos + activar brace para que la lumbar no compense.', type: 'warmup',
    executionMode: 'sequential',
  });
  await db.exercises.bulkAdd([
    { blockId: w, name: 'Breathing + brace (ribs down)', order: 1, sets: 1, repsMin: 60, repsMax: 60, repsUnit: 'seconds', restSeconds: 0, isOptional: false, videoUrl: 'https://youtube.com/shorts/ixkUbEfSMVk' },
    { blockId: w, name: 'Hip flexor stretch', order: 2, sets: 1, repsMin: 45, repsMax: 45, repsUnit: 'seconds', restSeconds: 0, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/UWIYsL5ewug' },
    { blockId: w, name: 'Adductor rockbacks', order: 3, sets: 2, repsMin: 8, repsMax: 8, repsUnit: 'reps', restSeconds: 20, perSide: true, isOptional: false, videoUrl: 'https://youtube.com/shorts/5MjQLLlFu1o' },
    { blockId: w, name: 'Glute bridge BW', order: 4, sets: 2, repsMin: 12, repsMax: 15, repsUnit: 'reps', restSeconds: 20, isOptional: false, notes: 'Squeeze 1s arriba.', videoUrl: 'https://youtube.com/shorts/OUgsJ8-Vi0E' },
    { blockId: w, name: 'Split squat BW', order: 5, sets: 1, repsMin: 8, repsMax: 8, repsUnit: 'reps', restSeconds: 20, perSide: true, isOptional: false, notes: 'Lento, control.', videoUrl: 'https://youtube.com/shorts/pauLo_t0M4o' },
    { blockId: w, name: 'Ramp-up Glute Bridge', order: 6, sets: 2, repsMin: 6, repsMax: 10, repsUnit: 'reps', restSeconds: 30, isOptional: false, notes: 'Set 1: Liviano ×10 | Set 2: Moderado ×6-8', videoUrl: 'https://youtube.com/shorts/OUgsJ8-Vi0E' },
  ]);

  // Block A — Glúteo principal
  const a = await db.blocks.add({
    dayId, name: 'Bloque A — Glúteo Principal', order: 1, duration: 20,
    objective: 'Estímulo principal de glúteo con bajo "impuesto lumbar".', type: 'main',
    executionMode: 'sequential', executionOrder: 'A1 Barbell Glute Bridge: Set 1 → 2 → 3 → 4, luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: a, name: 'Barbell Glute Bridge', order: 1, sets: 4, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '1-2', restSeconds: 90, restSecondsMax: 120, isOptional: false, coachingTips: 'Mentón levemente hacia adentro. Ribs down + brace suave. Arriba: glúteos + leve retroversión pélvica. No más altura arqueando lumbar. Bajada controlada 2-3s.', videoUrl: 'https://youtube.com/shorts/8bbE64NuDTU' },
    { blockId: a, name: 'DB Glute Bridge (burnout)', order: 2, sets: 2, repsMin: 15, repsMax: 25, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, isOptional: true, notes: 'Más tensión y bombeo sin carga axial. Alt: B-stance glute bridge 1×12-15/lado.', videoUrl: 'https://youtube.com/shorts/OUgsJ8-Vi0E' },
  ]);

  // Block B — Pierna unilateral
  const b = await db.blocks.add({
    dayId, name: 'Bloque B — Pierna Unilateral', order: 2, duration: 20,
    objective: 'Hipertrofia de cuádriceps y glúteo con estabilidad, sin castigar la lumbar.', type: 'main',
    executionMode: 'superset', executionOrder: 'B1 Bulgarian Split Squat: pierna A → pierna B = 1 set (×3), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: b, name: 'DB Bulgarian Split Squat', order: 1, sets: 3, repsMin: 8, repsMax: 12, repsUnit: 'reps', rir: '1-2', restSeconds: 90, restSecondsMax: 120, perSide: true, isOptional: false, coachingTips: 'Bajada 2-3s. Torso estable, ligera inclinación adelante ok (más glúteo). Rodilla acompaña el pie. Rango que puedas "poseer".', notes: '15-20s descanso entre piernas.', videoUrl: 'https://youtube.com/shorts/2C-uNgKwPLE' },
    { blockId: b, name: 'Goblet Squat a Box', order: 2, sets: 2, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '2', restSeconds: 60, restSecondsMax: 90, isOptional: true, notes: 'Cuádriceps extra con buena estabilidad. Alt: Reverse lunge con DB 1×10-12/lado.', videoUrl: 'https://youtube.com/shorts/MeIiIdhvXT4' },
  ]);

  // Block C — Isquios + glúteo medio + pantorrilla
  const c = await db.blocks.add({
    dayId, name: 'Bloque C — Isquios + Glúteo medio + Pantorrilla', order: 3, duration: 20,
    objective: 'Completar hipertrofia con ejercicios "seguros" para acercarte al fallo sin riesgos.', type: 'main',
    executionMode: 'sequential', executionOrder: 'C1 Ham Curl (todos los sets) → C2 Abductores (todos) → C3 Calf Raises (todos), luego opcional',
  });
  await db.exercises.bulkAdd([
    { blockId: c, name: 'Hamstring Curl', order: 1, sets: 3, repsMin: 10, repsMax: 15, repsUnit: 'reps', rir: '0-1', restSeconds: 60, restSecondsMax: 75, isOptional: false, coachingTips: 'Control bajada 2-3s. Sin "tirar" con la espalda. En TRX/fitball: cadera alta, no dejes que la lumbar se hunda.', notes: 'Máquina / TRX / fitball. Última serie puede ser muy dura.', videoUrl: 'https://youtube.com/shorts/1Tq3QdYUuHs' },
    { blockId: c, name: 'Abductores', order: 2, sets: 3, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '1-2', restSeconds: 45, restSecondsMax: 60, isOptional: false, coachingTips: 'Pelvis estable. No rebotes. Sentí glúteo medio, no "cintura".', notes: 'Máquina o band lateral walks.', videoUrl: 'https://youtube.com/shorts/FzMaFsJFOjY' },
    { blockId: c, name: 'Standing Calf Raises', order: 3, sets: 3, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '1', restSeconds: 45, restSecondsMax: 60, isOptional: false, notes: 'Pausa 1s arriba + bajada lenta. DB/KB/máquina.', videoUrl: 'https://youtube.com/shorts/RAol8M2FKGA' },
    { blockId: c, name: 'Aductores', order: 4, sets: 2, repsMin: 12, repsMax: 20, repsUnit: 'reps', rir: '2', restSeconds: 45, restSecondsMax: 60, isOptional: true, notes: 'Balance cadera, estabilidad pélvica. Alt: Extra ham curl +1 set 10-15 @ RIR 0-1.', videoUrl: 'https://youtube.com/shorts/pSis71JNFWQ' },
  ]);

  await addCoreBlocks(dayId);
}

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────────────

export async function seedDatabase() {
  const count = await db.routines.count();

  // Check if we need to re-seed (e.g. missing executionMode on blocks after schema upgrade)
  if (count > 0) {
    const firstBlock = await db.blocks.toCollection().first();
    if (firstBlock && firstBlock.executionMode) return; // Already has execution info

    // Existing data without execution order → wipe and re-seed
    console.log('🔄 Re-seeding database with execution order info...');
    await db.delete();
    await db.open();
  }

  const routineId = await db.routines.add({
    name: 'Mi Rutina 4 Días',
    description: 'Upper Push A → Upper Pull → Upper Push B → Lower/Glutes',
  });

  await seedDay1(routineId);
  await seedDay2(routineId);
  await seedDay3(routineId);
  await seedDay4(routineId);

  console.log('✅ Base de datos inicializada con rutina de 4 días');
}
