import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Clock, Play, ChevronDown, ChevronUp, Info, Star, Repeat, ArrowDownNarrowWide, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { db } from '../db/database';
import { formatRepsDisplay, formatRestTime } from '../utils/formatters';
import InlineVideo from '../components/ui/InlineVideo';
import type { Block, Exercise } from '../types';

const BLOCK_TYPE_COLORS: Record<string, string> = {
  warmup: 'ring-amber-500/15 bg-amber-500/[0.03]',
  main: 'ring-white/10 bg-white/[0.02]',
  core: 'ring-violet-500/20 bg-violet-500/[0.03]',
};

const BLOCK_TYPE_LABELS: Record<string, { text: string; color: string }> = {
  warmup: { text: 'WARM-UP', color: 'text-amber-400' },
  main: { text: 'PRINCIPAL', color: 'text-pink-400' },
  core: { text: 'CORE', color: 'text-violet-400' },
};

export default function RoutineDayPage() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const id = Number(dayId);

  const day = useLiveQuery(() => db.routineDays.get(id), [id]);
  const blocks = useLiveQuery(
    () => db.blocks.where('dayId').equals(id).sortBy('order'),
    [id]
  );
  const exercises = useLiveQuery(async () => {
    if (!blocks || blocks.length === 0) return [];
    const blockIds = blocks.map((b) => b.id!);
    return db.exercises.where('blockId').anyOf(blockIds).toArray();
  }, [blocks]);

  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    onConfirm: () => void;
  } | null>(null);

  const toggleBlock = (blockId: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const toggleTip = (exerciseId: number) => {
    setExpandedTips((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  };

  const createNewSession = async () => {
    if (!day) return;
    const sessionId = await db.workoutSessions.add({
      dayId: id,
      routineId: day.routineId,
      date: new Date(),
      status: 'in-progress',
      startedAt: new Date(),
    });
    navigate(`/session/${sessionId}`);
  };

  const startWorkout = async () => {
    if (!day) return;
    const existing = await db.workoutSessions
      .where('status')
      .equals('in-progress')
      .first();
    if (existing) {
      if (existing.dayId === id) {
        navigate(`/session/${existing.id}`);
        return;
      }
      setConfirmModal({
        open: true,
        onConfirm: async () => {
          await db.workoutSessions.update(existing.id!, {
            status: 'abandoned',
            finishedAt: new Date(),
          });
          setConfirmModal(null);
          await createNewSession();
        },
      });
      return;
    }
    await createNewSession();
  };

  const getExercisesForBlock = (blockId: number) =>
    (exercises || []).filter((e) => e.blockId === blockId).sort((a, b) => a.order - b.order);

  if (!day || !blocks || !exercises) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 -mx-4 -mt-4">
      {/* Day Header */}
      <div className="bg-gray-950/80 px-4 py-4 border-b border-white/5">
        <button onClick={() => navigate('/')} className="text-gray-400 mb-3 flex items-center gap-1 text-sm hover:text-white transition-colors">
          <ArrowLeft size={18} />
          Volver
        </button>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
              Día {day.dayNumber}
            </span>
            <h2 className="text-2xl font-bold text-radiant">{day.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{day.focus}</p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 bg-white/5 ring-1 ring-white/10 px-3 py-1.5 rounded-lg">
            <Clock size={14} />
            <span className="text-sm font-medium">{day.totalDuration}'</span>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="px-4 space-y-3">
        {blocks.map((block) => {
          const blockExercises = getExercisesForBlock(block.id!);
          const isExpanded = expandedBlocks.has(block.id!);
          const label = BLOCK_TYPE_LABELS[block.type];
          const colors = BLOCK_TYPE_COLORS[block.type];

          return (
            <div key={block.id} className={`rounded-xl ring-1 ${colors}`}>
              <button
                onClick={() => toggleBlock(block.id!)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold tracking-wider ${label.color}`}>
                      {label.text}
                    </span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500">{block.duration}'</span>
                  </div>
                  <h3 className="font-semibold text-sm text-white truncate">{block.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{block.objective}</p>
                </div>
                <div className="ml-2 shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-600">{blockExercises.length} ej</span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {block.notes && (
                    <div className="text-xs text-pink-300/70 bg-pink-500/5 ring-1 ring-pink-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Repeat size={12} />
                      {block.notes}
                    </div>
                  )}
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
                  {blockExercises.map((exercise) => (
                    <ExercisePreview
                      key={exercise.id}
                      exercise={exercise}
                      showTips={expandedTips.has(exercise.id!)}
                      onToggleTips={() => toggleTip(exercise.id!)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Workout Button */}
      <div className="px-4 pb-6 pt-2">
        <button
          onClick={startWorkout}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-400 hover:via-violet-400 hover:to-blue-400 active:from-pink-600 active:via-violet-600 active:to-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
        >
          <Play size={22} fill="currentColor" />
          Iniciar Entrenamiento
        </button>
      </div>

      {/* Confirm Modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className="relative bg-gray-900 ring-1 ring-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 pb-8 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white">Sesión activa</h3>
            <p className="text-sm text-gray-400">Ya hay una sesión en curso. ¿Querés abandonarla y empezar una nueva?</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 ring-1 ring-white/10 hover:bg-white/10 text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
              >
                Abandonar y empezar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExercisePreview({
  exercise,
  showTips,
  onToggleTips,
}: {
  exercise: Exercise;
  showTips: boolean;
  onToggleTips: () => void;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${
        exercise.isOptional
          ? 'bg-white/[0.02] ring-1 ring-dashed ring-white/5'
          : 'bg-white/[0.03]'
      }`}
    >
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
            <h4 className="font-medium text-sm text-white">{exercise.name}</h4>
          </div>

          <div className="flex items-center gap-2.5 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="font-medium text-gray-300">{formatRepsDisplay(exercise)}</span>
            {exercise.rir && (
              <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                RIR {exercise.rir}
              </span>
            )}
            {exercise.weight && (
              <span className="text-emerald-400/80 font-medium">
                {exercise.weight} {exercise.weightUnit || 'kg'}
              </span>
            )}
            {exercise.restSeconds > 0 && (
              <span className="text-gray-500">
                Rest {formatRestTime(exercise.restSeconds, exercise.restSecondsMax)}
              </span>
            )}
          </div>

          {exercise.tempo && (
            <p className="text-[10px] text-amber-400/60 mt-1">Tempo: {exercise.tempo}</p>
          )}
          {exercise.notes && (
            <p className="text-[11px] text-gray-500 mt-1 italic">{exercise.notes}</p>
          )}
        </div>

        {exercise.coachingTips && (
          <button onClick={onToggleTips} className="text-gray-600 hover:text-amber-400 p-1 shrink-0">
            <Info size={14} />
          </button>
        )}
      </div>

      {showTips && exercise.coachingTips && (
        <div className="mt-2 text-xs text-amber-300/80 bg-amber-500/5 rounded-lg px-3 py-2 ring-1 ring-amber-500/10">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={10} className="text-amber-400" />
            <span className="font-semibold text-[10px] uppercase tracking-wider text-amber-400">
              Coaching Tips
            </span>
          </div>
          {exercise.coachingTips}
        </div>
      )}

      <InlineVideo videoUrl={exercise.videoUrl} />
    </div>
  );
}
