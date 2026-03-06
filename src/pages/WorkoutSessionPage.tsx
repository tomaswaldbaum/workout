import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, CheckCheck, ChevronDown, ChevronUp, Clock, Trophy, ArrowLeft, Info, Star, Shuffle, ArrowDownNarrowWide, ChevronsRight, GripVertical } from 'lucide-react';
import { db } from '../db/database';
import { formatRepsDisplay, formatRestTime, formatElapsedTime } from '../utils/formatters';
import InlineVideo from '../components/ui/InlineVideo';
import RestTimer from '../components/ui/RestTimer';
import { blockConfetti, finishConfetti } from '../utils/confetti';
import { useDragReorder } from '../hooks/useDragReorder';
import type { Exercise, SetLog, Block } from '../types';

export default function WorkoutSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const id = Number(sessionId);

  const session = useLiveQuery(() => db.workoutSessions.get(id), [id]);
  const day = useLiveQuery(
    () => (session?.dayId ? db.routineDays.get(session.dayId) : undefined),
    [session?.dayId]
  );
  const blocks = useLiveQuery(
    () => (session?.dayId ? db.blocks.where('dayId').equals(session.dayId).sortBy('order') : []),
    [session?.dayId]
  );
  const exercises = useLiveQuery(async () => {
    if (!session?.dayId) return [];
    const dayBlocks = await db.blocks.where('dayId').equals(session.dayId).toArray();
    const blockIds = dayBlocks.map((b) => b.id!);
    return db.exercises.where('blockId').anyOf(blockIds).toArray();
  }, [session?.dayId]);
  const setLogs = useLiveQuery(() => db.setLogs.where('sessionId').equals(id).toArray(), [id]);

  // Local block ordering (session-level reorder via drag & drop)
  const [blockOrder, setBlockOrder] = useState<number[] | null>(null);

  // Build the ordered blocks array
  const orderedBlocks = useMemo(() => {
    if (!blocks) return [];
    if (!blockOrder) return blocks;
    // Re-sort blocks according to our local order
    const byId = new Map(blocks.map((b) => [b.id!, b]));
    return blockOrder.map((id) => byId.get(id)).filter(Boolean) as Block[];
  }, [blocks, blockOrder]);

  // Sync blockOrder when blocks first load
  useEffect(() => {
    if (blocks && blocks.length > 0 && blockOrder === null) {
      setBlockOrder(blocks.map((b) => b.id!));
    }
  }, [blocks, blockOrder]);

  // Reorder callback from drag hook
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setBlockOrder((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const { items: dragBlocks, getItemProps, getHandleProps, isDragging } = useDragReorder(
    orderedBlocks,
    handleReorder
  );

  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimer, setRestTimer] = useState<{
    exerciseName: string;
    totalSeconds: number;
  } | null>(null);
  const restTimerKeyRef = useRef(0);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
    cancelLabel?: string;
  } | null>(null);

  // Timer
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;
    const update = () =>
      setElapsedTime(Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Toggle block collapse
  const toggleBlock = (blockId: number) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  // Toggle set completion (internal)
  const doToggleSet = async (exerciseId: number, setNumber: number, exercise: Exercise) => {
    const existing = setLogs?.find(
      (l) => l.exerciseId === exerciseId && l.setNumber === setNumber
    );
    let justCompleted = false;
    if (existing) {
      const willComplete = !existing.completed;
      await db.setLogs.update(existing.id!, {
        completed: willComplete,
        completedAt: willComplete ? new Date() : undefined,
      });
      justCompleted = willComplete;
    } else {
      await db.setLogs.add({
        sessionId: id,
        exerciseId,
        setNumber,
        completed: true,
        actualReps: exercise.repsMin === exercise.repsMax ? exercise.repsMin : exercise.repsMin,
        actualWeight: exercise.weight,
        completedAt: new Date(),
      });
      justCompleted = true;
    }

    // Start rest timer if set was just completed and exercise has rest time
    if (justCompleted && exercise.restSeconds > 0) {
      restTimerKeyRef.current += 1;
      setRestTimer({
        exerciseName: exercise.name,
        totalSeconds: exercise.restSeconds,
      });
    }
  };

  // Toggle set with skip-ahead warning for earlier incomplete blocks
  const toggleSet = (exerciseId: number, setNumber: number, exercise: Exercise) => {
    // Check if this is a completion action
    const existing = setLogs?.find(
      (l) => l.exerciseId === exerciseId && l.setNumber === setNumber
    );
    const isCompleting = !existing || !existing.completed;

    if (isCompleting && orderedBlocks.length > 0 && exercises) {
      const currentIdx = orderedBlocks.findIndex((b) => b.id === exercise.blockId);
      if (currentIdx > 0) {
        const prevIncomplete = orderedBlocks.filter((b, i) => {
          if (i >= currentIdx) return false;
          if (completedBlocks.has(b.id!)) return false;
          // Check if block has any uncompleted sets
          const blockExs = (exercises || []).filter((e) => e.blockId === b.id!);
          const allBlockSetsDone = blockExs.every((ex) => {
            for (let s = 1; s <= ex.sets; s++) {
              if (!isSetCompleted(ex.id!, s)) return false;
            }
            return true;
          });
          return !allBlockSetsDone;
        });

        if (prevIncomplete.length > 0) {
          const blockNames = prevIncomplete.map((b) => b.name).join(', ');
          setConfirmModal({
            open: true,
            title: 'Bloques anteriores incompletos',
            message: `Hay bloques anteriores sin completar (${blockNames}). ¿Querés dar por completados y continuar desde acá?`,
            confirmLabel: 'Sí, continuar',
            cancelLabel: 'No, volver',
            confirmColor: 'bg-pink-600 hover:bg-pink-500',
            onConfirm: () => {
              const newCompleted = new Set(completedBlocks);
              const newCollapsed = new Set(collapsedBlocks);
              for (const b of prevIncomplete) {
                newCompleted.add(b.id!);
                newCollapsed.add(b.id!);
              }
              setCompletedBlocks(newCompleted);
              setCollapsedBlocks(newCollapsed);
              setConfirmModal(null);
              doToggleSet(exerciseId, setNumber, exercise);
            },
          });
          return;
        }
      }
    }

    doToggleSet(exerciseId, setNumber, exercise);
  };

  // Update reps/weight for a set
  const updateSetLog = async (
    exerciseId: number,
    setNumber: number,
    field: 'actualReps' | 'actualWeight',
    value: number
  ) => {
    const existing = setLogs?.find(
      (l) => l.exerciseId === exerciseId && l.setNumber === setNumber
    );
    if (existing) {
      await db.setLogs.update(existing.id!, { [field]: value });
    } else {
      await db.setLogs.add({
        sessionId: id,
        exerciseId,
        setNumber,
        completed: false,
        [field]: value,
      });
    }
  };

  // Progress
  const progress = useMemo(() => {
    if (!exercises || !setLogs) return { completed: 0, total: 0, percentage: 0 };
    const required = exercises.filter((e) => !e.isOptional);
    const total = required.reduce((sum, e) => sum + e.sets, 0);
    const completed = setLogs.filter(
      (l) => l.completed && required.some((e) => e.id === l.exerciseId)
    ).length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [exercises, setLogs]);

  // Finish workout
  const finishWorkout = () => {
    setConfirmModal({
      open: true,
      title: 'Finalizar entrenamiento',
      message: `Completaste ${progress.completed}/${progress.total} sets. ¿Finalizar?`,
      confirmLabel: 'Finalizar',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-500',
      onConfirm: async () => {
        await db.workoutSessions.update(id, { status: 'completed', finishedAt: new Date() });
        setConfirmModal(null);
        finishConfetti();
        setTimeout(() => navigate('/'), 2200);
      },
    });
  };

  // Abandon workout
  const abandonWorkout = () => {
    setConfirmModal({
      open: true,
      title: 'Abandonar sesión',
      message: 'Se guardará como incompleta. ¿Estás seguro?',
      confirmLabel: 'Abandonar',
      confirmColor: 'bg-red-600 hover:bg-red-500',
      onConfirm: async () => {
        await db.workoutSessions.update(id, { status: 'abandoned', finishedAt: new Date() });
        setConfirmModal(null);
        navigate('/');
      },
    });
  };

  // Helpers
  const getExercisesForBlock = (blockId: number) =>
    (exercises || []).filter((e) => e.blockId === blockId).sort((a, b) => a.order - b.order);

  const isSetCompleted = (exerciseId: number, setNumber: number) =>
    setLogs?.some(
      (l) => l.exerciseId === exerciseId && l.setNumber === setNumber && l.completed
    ) ?? false;

  const getSetLog = (exerciseId: number, setNumber: number) =>
    setLogs?.find((l) => l.exerciseId === exerciseId && l.setNumber === setNumber);

  // Compute the single global next set across the entire routine
  // Respects: block order → execution mode → required before optional
  const globalNextSet = useMemo((): { blockId: number; exerciseId: number; setNumber: number } | null => {
    if (!orderedBlocks.length || !exercises || !setLogs) return null;

    const isCompleted = (exId: number, setNum: number) =>
      setLogs.some((l) => l.exerciseId === exId && l.setNumber === setNum && l.completed);

    for (const block of orderedBlocks) {
      // Skip blocks manually completed
      if (completedBlocks.has(block.id!)) continue;

      const blockExercises = (exercises || [])
        .filter((e) => e.blockId === block.id!)
        .sort((a, b) => a.order - b.order);

      if (blockExercises.length === 0) continue;

      const required = blockExercises.filter((e) => !e.isOptional);
      const optional = blockExercises.filter((e) => e.isOptional);

      // Check if all required sets are done
      const allRequiredDone = required.every((ex) => {
        for (let s = 1; s <= ex.sets; s++) {
          if (!isCompleted(ex.id!, s)) return false;
        }
        return true;
      });

      // Pick which pool to search: required first, then optional
      const pool = allRequiredDone ? optional : required;

      let found: { blockId: number; exerciseId: number; setNumber: number } | null = null;

      if (block.executionMode === 'superset') {
        // Round-robin: S1 of all pool exercises, then S2, etc.
        const maxSets = Math.max(...pool.map((e) => e.sets), 0);
        for (let setNum = 1; setNum <= maxSets && !found; setNum++) {
          for (const ex of pool) {
            if (setNum <= ex.sets && !isCompleted(ex.id!, setNum)) {
              found = { blockId: block.id!, exerciseId: ex.id!, setNumber: setNum };
              break;
            }
          }
        }
      } else {
        // Sequential: all sets of exercise 1, then exercise 2, etc.
        for (const ex of pool) {
          for (let setNum = 1; setNum <= ex.sets; setNum++) {
            if (!isCompleted(ex.id!, setNum)) {
              found = { blockId: block.id!, exerciseId: ex.id!, setNumber: setNum };
              break;
            }
          }
          if (found) break;
        }
      }

      // If we found an uncompleted set in this block, that's the global next
      if (found) return found;
      // Otherwise this block is fully done, move to the next block
    }

    return null; // Everything done
  }, [orderedBlocks, exercises, setLogs, completedBlocks]);

  // Complete an entire block at once (skip without marking individual sets)
  const completeBlock = (blockId: number) => {
    setCompletedBlocks((prev) => new Set([...prev, blockId]));
    setCollapsedBlocks((prev) => new Set([...prev, blockId]));
    blockConfetti();
  };

  // Auto-collapse blocks when they become fully completed
  const prevBlockDoneRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!orderedBlocks.length || !exercises || !setLogs) return;

    for (const block of orderedBlocks) {
      const blockExercises = (exercises || []).filter((e) => e.blockId === block.id!);
      const totalSets = blockExercises.reduce((sum, e) => sum + e.sets, 0);
      let completedSets = 0;
      for (const ex of blockExercises) {
        for (let s = 1; s <= ex.sets; s++) {
          if (setLogs.some((l) => l.exerciseId === ex.id! && l.setNumber === s && l.completed)) {
            completedSets++;
          }
        }
      }
      const isDone = (completedSets >= totalSets && totalSets > 0) || completedBlocks.has(block.id!);
      const wasDone = prevBlockDoneRef.current.has(block.id!);

      if (isDone && !wasDone) {
        // Block just became complete → auto-collapse + confetti
        setCollapsedBlocks((prev) => new Set([...prev, block.id!]));
        prevBlockDoneRef.current.add(block.id!);
        blockConfetti();
      } else if (!isDone && wasDone) {
        prevBlockDoneRef.current.delete(block.id!);
      }
    }
  }, [orderedBlocks, exercises, setLogs, completedBlocks]);

  if (!session || !day || !blocks || !exercises) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isSessionCompleted = session.status === 'completed';

  return (
    <div className="space-y-3 -mx-4 -mt-4">
      {/* Session Header */}
      <div className="bg-gray-950/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(`/day/${day.id}`)} className="text-gray-400 hover:text-white transition-colors p-1">
            <ArrowLeft size={22} />
          </button>
          <div className="text-center flex-1">
            <h2 className="font-bold text-base">
              Día {day.dayNumber} — {day.name}
            </h2>
          </div>
          <div className="text-pink-400 font-mono text-sm flex items-center gap-1">
            <Clock size={14} />
            {formatElapsedTime(elapsedTime)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 min-w-[52px] text-right font-mono">
            {progress.completed}/{progress.total}
          </span>
          <span className="text-xs text-gray-500">{progress.percentage}%</span>
        </div>
      </div>

      {/* Blocks */}
      <div className={`px-4 space-y-3 ${isDragging ? 'select-none' : ''}`}>
        {dragBlocks.map((block, index) => {
          const blockExercises = getExercisesForBlock(block.id!);
          const blockTotalSets = blockExercises.reduce((sum, e) => sum + e.sets, 0);
          const blockCompletedSets = blockExercises.reduce((sum, e) => {
            let count = 0;
            for (let s = 1; s <= e.sets; s++) {
              if (isSetCompleted(e.id!, s)) count++;
            }
            return sum + count;
          }, 0);
          const isBlockDone = (blockCompletedSets >= blockTotalSets && blockTotalSets > 0) || completedBlocks.has(block.id!);
          const isCollapsed = collapsedBlocks.has(block.id!);
          const itemProps = getItemProps(index);

          return (
            <div
              key={block.id}
              ref={itemProps.ref}
              style={itemProps.style}
              data-drag-index={itemProps['data-drag-index']}
              className={`rounded-xl ring-1 transition-colors ${
                isBlockDone
                  ? 'ring-emerald-500/20 bg-emerald-500/[0.03]'
                  : 'ring-white/10 bg-white/[0.02]'
              }`}
            >
              {/* Block header */}
              <div
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                {/* Drag handle */}
                {!isSessionCompleted && (
                  <div
                    {...getHandleProps(index)}
                    className="-ml-1 mr-1.5 p-1 rounded-md text-gray-600 hover:text-gray-400 hover:bg-white/5 active:text-pink-400 transition-colors shrink-0"
                    title="Arrastrar para reordenar"
                  >
                    <GripVertical size={16} />
                  </div>
                )}
                <button
                  onClick={() => toggleBlock(block.id!)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  {isBlockDone && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3
                      className={`font-semibold text-sm truncate ${
                        isBlockDone ? 'text-emerald-300' : 'text-white'
                      }`}
                    >
                      {block.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {block.duration}' — {blockCompletedSets}/{blockTotalSets} sets
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Complete block button */}
                  {!isBlockDone && !isSessionCompleted && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        completeBlock(block.id!);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); completeBlock(block.id!); } }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 ring-1 ring-white/10 text-gray-500 hover:bg-emerald-500/10 hover:ring-emerald-500/20 hover:text-emerald-400 transition-all active:scale-95"
                      title="Completar bloque entero"
                    >
                      <CheckCheck size={14} />
                    </div>
                  )}
                  <button onClick={() => toggleBlock(block.id!)} className="p-0.5">
                    {isCollapsed ? (
                      <ChevronDown size={18} className="text-gray-500" />
                    ) : (
                      <ChevronUp size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Exercises */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-2.5">
                  {block.executionOrder && block.type === 'main' && (
                    <div className={`text-xs rounded-lg px-3 py-2 flex items-start gap-2 ${
                      block.executionMode === 'superset'
                        ? 'bg-violet-500/5 ring-1 ring-violet-500/15 text-violet-300/90'
                        : 'bg-white/[0.02] ring-1 ring-white/5 text-gray-400'
                    }`}>
                      {block.executionMode === 'superset' ? (
                        <Shuffle size={13} className="text-violet-400 shrink-0 mt-0.5" />
                      ) : (
                        <ArrowDownNarrowWide size={13} className="text-gray-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-bold text-[10px] uppercase tracking-wider ${
                          block.executionMode === 'superset' ? 'text-violet-400' : 'text-gray-500'
                        }`}>
                          {block.executionMode === 'superset' ? 'ALTERNAR' : 'SECUENCIAL'}
                        </span>
                        <p className="mt-0.5">{block.executionOrder}</p>
                      </div>
                    </div>
                  )}
                  {blockExercises.map((exercise) => {
                    const nextSetNumber =
                      globalNextSet?.blockId === block.id! && globalNextSet?.exerciseId === exercise.id
                        ? globalNextSet.setNumber
                        : null;
                    return (
                      <ExerciseTracker
                        key={exercise.id}
                        exercise={exercise}
                        setLogs={setLogs || []}
                        onToggleSet={(setNum) => toggleSet(exercise.id!, setNum, exercise)}
                        onUpdateSet={(setNum, field, value) =>
                          updateSetLog(exercise.id!, setNum, field, value)
                        }
                        getSetLog={(setNum) => getSetLog(exercise.id!, setNum)}
                        isSetCompleted={(setNum) => isSetCompleted(exercise.id!, setNum)}
                        disabled={isSessionCompleted}
                        nextSetNumber={nextSetNumber}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!isSessionCompleted && (
        <div className="px-4 pb-8 space-y-3">
          <button
            onClick={finishWorkout}
            className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Trophy size={22} />
            Finalizar Entrenamiento
          </button>
          <button
            onClick={abandonWorkout}
            className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Abandonar sesión
          </button>
        </div>
      )}

      {isSessionCompleted && (
        <div className="px-4 pb-8 text-center">
          <div className="bg-emerald-500/5 ring-1 ring-emerald-500/20 rounded-xl p-6">
            <Trophy size={40} className="text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-300">¡Entrenamiento completado!</h3>
            <p className="text-sm text-gray-400 mt-1">
              {progress.completed}/{progress.total} sets — {formatElapsedTime(elapsedTime)}
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2.5 bg-white/5 ring-1 ring-white/10 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Rest Timer */}
      {restTimer && (
        <RestTimer
          key={restTimerKeyRef.current}
          totalSeconds={restTimer.totalSeconds}
          exerciseName={restTimer.exerciseName}
          onDismiss={() => setRestTimer(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className="relative bg-gray-900 ring-1 ring-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 pb-8 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            <p className="text-sm text-gray-400">{confirmModal.message}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 ring-1 ring-white/10 hover:bg-white/10 text-gray-300 transition-colors"
              >
                {confirmModal.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exercise Tracker Component ───────────────────────────────────────────

function ExerciseTracker({
  exercise,
  setLogs,
  onToggleSet,
  onUpdateSet,
  getSetLog,
  isSetCompleted,
  disabled,
  nextSetNumber,
}: {
  exercise: Exercise;
  setLogs: SetLog[];
  onToggleSet: (setNumber: number) => void;
  onUpdateSet: (setNumber: number, field: 'actualReps' | 'actualWeight', value: number) => void;
  getSetLog: (setNumber: number) => SetLog | undefined;
  isSetCompleted: (setNumber: number) => boolean;
  disabled: boolean;
  nextSetNumber: number | null;
}) {
  const [showTips, setShowTips] = useState(false);

  const completedCount = Array.from({ length: exercise.sets }, (_, i) => i + 1).filter((s) =>
    isSetCompleted(s)
  ).length;
  const allDone = completedCount === exercise.sets;
  const hasNextSet = nextSetNumber !== null;

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all ${
        exercise.isOptional
          ? 'bg-white/[0.02] ring-1 ring-dashed ring-white/5'
          : hasNextSet
            ? 'bg-white/[0.03] ring-1 ring-pink-500/15'
            : 'bg-white/[0.03]'
      } ${allDone ? 'opacity-70' : ''}`}
    >
      {/* Exercise header */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {exercise.isOptional && (
                <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                  OPC
                </span>
              )}
              {exercise.supersetTag && (
                <span className="text-[9px] bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded font-medium">
                  SS {exercise.supersetTag}
                </span>
              )}
              <h4
                className={`font-medium text-sm ${allDone ? 'line-through text-gray-500' : 'text-white'}`}
              >
                {exercise.name}
              </h4>
              <span className="text-[10px] text-gray-500">
                ({completedCount}/{exercise.sets})
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 flex-wrap">
              <span>{formatRepsDisplay(exercise)}</span>
              {exercise.rir && <span>RIR {exercise.rir}</span>}
              {exercise.weight && (
                <span className="text-emerald-400/70">
                  {exercise.weight} {exercise.weightUnit || 'kg'}
                </span>
              )}
              {exercise.restSeconds > 0 && (
                <span>Rest {formatRestTime(exercise.restSeconds, exercise.restSecondsMax)}</span>
              )}
            </div>
          </div>

          {exercise.coachingTips && (
            <button
              onClick={() => setShowTips(!showTips)}
              className={`p-1 shrink-0 transition-colors ${
                showTips ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'
              }`}
            >
              <Info size={14} />
            </button>
          )}
        </div>

        {showTips && exercise.coachingTips && (
          <div className="mt-1.5 text-[11px] text-amber-300/80 bg-amber-500/5 rounded px-2.5 py-1.5 ring-1 ring-amber-500/10">
            <div className="flex items-center gap-1 mb-0.5">
              <Star size={9} className="text-amber-400" />
              <span className="font-semibold text-[9px] uppercase tracking-wider text-amber-400">Tips</span>
            </div>
            {exercise.coachingTips}
          </div>
        )}

        {exercise.notes && (
          <p className="text-[10px] text-gray-600 mt-1 italic">{exercise.notes}</p>
        )}
      </div>

      {/* Set rows */}
      <div className="px-2 pb-2 space-y-1">
        {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNum) => {
          const log = getSetLog(setNum);
          const completed = isSetCompleted(setNum);
          const isNext = setNum === nextSetNumber;

          return (
            <div
              key={setNum}
              className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                completed
                  ? 'bg-emerald-500/5'
                  : isNext
                    ? 'bg-pink-500/[0.08] ring-1 ring-pink-500/25'
                    : 'bg-white/[0.02]'
              }`}
            >
              {/* Set number / next indicator */}
              {isNext ? (
                <span className="text-[11px] text-pink-400 w-6 text-center font-mono flex items-center justify-center">
                  <ChevronsRight size={14} className="animate-pulse" />
                </span>
              ) : (
                <span className="text-[11px] text-gray-500 w-6 text-center font-mono">S{setNum}</span>
              )}

              {/* Reps input */}
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-11 bg-white/5 ring-1 ring-white/10 rounded px-1.5 py-1 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50"
                  defaultValue={log?.actualReps ?? exercise.repsMin}
                  disabled={disabled}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0) onUpdateSet(setNum, 'actualReps', val);
                  }}
                />
                <span className="text-[10px] text-gray-600 w-5">
                  {exercise.repsUnit === 'seconds' ? 's' : exercise.repsUnit === 'meters' ? 'm' : 'r'}
                </span>
              </div>

              {/* Weight input (only if applicable) */}
              {exercise.weight !== undefined && exercise.weight > 0 ? (
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    className="w-14 bg-white/5 ring-1 ring-white/10 rounded px-1.5 py-1 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50"
                    defaultValue={log?.actualWeight ?? exercise.weight}
                    disabled={disabled}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0) onUpdateSet(setNum, 'actualWeight', val);
                    }}
                  />
                  <span className="text-[10px] text-gray-600 w-5">
                    {exercise.weightUnit || 'kg'}
                  </span>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              {/* Complete button */}
              <button
                onClick={() => !disabled && onToggleSet(setNum)}
                disabled={disabled}
                className={`ml-auto w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                  completed
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                    : 'bg-white/5 ring-1 ring-white/10 text-gray-500 hover:bg-white/10 active:scale-95'
                } disabled:opacity-50`}
              >
                <Check size={18} strokeWidth={completed ? 3 : 2} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline video */}
      <div className="px-3 pb-2">
        <InlineVideo videoUrl={exercise.videoUrl} />
      </div>
    </div>
  );
}
