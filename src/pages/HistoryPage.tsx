import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { db } from '../db/database';
import { formatDateFull, formatElapsedTime } from '../utils/formatters';
import type { WorkoutSession, RoutineDay, Block, SetLog, Exercise } from '../types';

export default function HistoryPage() {
  const sessions = useLiveQuery(async () => {
    const all = await db.workoutSessions
      .where('status')
      .anyOf(['completed', 'abandoned'])
      .toArray();
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  const days = useLiveQuery(() => db.routineDays.toArray());
  const allSetLogs = useLiveQuery(() => db.setLogs.toArray());
  const allExercises = useLiveQuery(() => db.exercises.toArray());
  const allBlocks = useLiveQuery(() => db.blocks.toArray());

  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  if (!sessions || !days || !allSetLogs || !allExercises || !allBlocks) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getDayForSession = (s: WorkoutSession): RoutineDay | undefined =>
    days.find((d) => d.id === s.dayId);

  const getSessionLogs = (sessionId: number): SetLog[] =>
    allSetLogs.filter((l) => l.sessionId === sessionId);

  const getSessionDuration = (s: WorkoutSession): number => {
    if (!s.finishedAt) return 0;
    return Math.floor(
      (new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 1000
    );
  };

  const deleteSession = async (sessionId: number) => {
    await db.setLogs.where('sessionId').equals(sessionId).delete();
    await db.workoutSessions.delete(sessionId);
    setDeleteConfirm(null);
    setExpandedSession(null);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calendar size={48} className="text-gray-700 mb-4" />
        <h3 className="text-lg font-semibold text-gray-400">Sin historial todavía</h3>
        <p className="text-sm text-gray-600 mt-1">
          Completá tu primer entrenamiento para ver el historial acá.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-radiant">Historial</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} registrada
          {sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const day = getDayForSession(session);
          const logs = getSessionLogs(session.id!);
          const completedSets = logs.filter((l) => l.completed).length;
          const duration = getSessionDuration(session);
          const isExpanded = expandedSession === session.id;
          const isAbandoned = session.status === 'abandoned';

          return (
            <div
              key={session.id}
              className={`rounded-xl ring-1 overflow-hidden ${
                isAbandoned
                  ? 'ring-red-500/15 bg-red-500/[0.03]'
                  : 'ring-white/10 bg-white/[0.02]'
              }`}
            >
              {/* Session summary */}
              <button
                onClick={() => setExpandedSession(isExpanded ? null : session.id!)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isAbandoned ? (
                      <XCircle size={18} className="text-red-400/60 shrink-0" />
                    ) : (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm text-white">
                        {day ? `Día ${day.dayNumber} — ${day.name}` : 'Sesión'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateFull(session.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        <Clock size={11} />
                        {formatElapsedTime(duration)}
                      </div>
                      <div className="text-[10px] text-gray-500">{completedSets} sets</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-3 border-t border-white/5">
                  <SessionDetails
                    dayId={session.dayId}
                    logs={logs}
                    exercises={allExercises}
                    blocks={allBlocks}
                  />
                  <button
                    onClick={() => setDeleteConfirm(session.id!)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                    Eliminar sesión
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-gray-900 ring-1 ring-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 pb-8 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white">Eliminar sesión</h3>
            <p className="text-sm text-gray-400">¿Eliminar esta sesión del historial? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 ring-1 ring-white/10 hover:bg-white/10 text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteSession(deleteConfirm)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionDetails({
  dayId,
  logs,
  exercises,
  blocks,
}: {
  dayId: number;
  logs: SetLog[];
  exercises: Exercise[];
  blocks: Block[];
}) {
  const dayBlocks = blocks
    .filter((b) => b.dayId === dayId)
    .sort((a, b) => a.order - b.order);

  if (dayBlocks.length === 0) {
    return <p className="text-xs text-gray-600 py-2">Sin datos para esta sesión.</p>;
  }

  return (
    <div className="mt-2 space-y-2.5">
      {dayBlocks.map((block) => {
        const blockExercises = exercises
          .filter((e) => e.blockId === block.id)
          .sort((a, b) => a.order - b.order);

        if (blockExercises.length === 0) return null;

        let blockTotal = 0;
        let blockCompleted = 0;
        for (const ex of blockExercises) {
          for (let s = 1; s <= ex.sets; s++) {
            blockTotal++;
            if (logs.some((l) => l.exerciseId === ex.id && l.setNumber === s && l.completed))
              blockCompleted++;
          }
        }

        const blockStatus =
          blockCompleted === 0 ? 'none' : blockCompleted >= blockTotal ? 'complete' : 'partial';

        return (
          <div
            key={block.id}
            className={`rounded-lg ring-1 overflow-hidden ${
              blockStatus === 'complete'
                ? 'ring-emerald-500/15 bg-emerald-500/[0.02]'
                : blockStatus === 'partial'
                  ? 'ring-amber-500/15 bg-amber-500/[0.02]'
                  : 'ring-white/5 bg-white/[0.02]'
            }`}
          >
            {/* Block header */}
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/5">
              <h4
                className={`text-[11px] font-semibold ${
                  blockStatus === 'complete'
                    ? 'text-emerald-400'
                    : blockStatus === 'partial'
                      ? 'text-amber-400'
                      : 'text-gray-500'
                }`}
              >
                {block.name}
              </h4>
              <span
                className={`text-[10px] font-mono ${
                  blockStatus === 'complete'
                    ? 'text-emerald-400'
                    : blockStatus === 'partial'
                      ? 'text-amber-400'
                      : 'text-gray-600'
                }`}
              >
                {blockCompleted}/{blockTotal} sets
              </span>
            </div>

            {/* Exercises */}
            <div className="px-2.5 py-1.5 space-y-1.5">
              {blockExercises.map((exercise) => {
                let exCompleted = 0;
                for (let s = 1; s <= exercise.sets; s++) {
                  if (
                    logs.some(
                      (l) =>
                        l.exerciseId === exercise.id && l.setNumber === s && l.completed
                    )
                  )
                    exCompleted++;
                }
                const exStatus =
                  exCompleted === 0
                    ? 'none'
                    : exCompleted >= exercise.sets
                      ? 'complete'
                      : 'partial';

                return (
                  <div key={exercise.id} className="py-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            exStatus === 'complete'
                              ? 'bg-emerald-400'
                              : exStatus === 'partial'
                                ? 'bg-amber-400'
                                : 'bg-gray-700'
                          }`}
                        />
                        <span
                          className={`text-xs truncate ${
                            exStatus === 'none' ? 'text-gray-600' : 'text-gray-300'
                          }`}
                        >
                          {exercise.name}
                          {exercise.isOptional && (
                            <span className="text-[9px] text-gray-600 ml-1">(opc)</span>
                          )}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          exStatus === 'complete'
                            ? 'text-emerald-400'
                            : exStatus === 'partial'
                              ? 'text-amber-400'
                              : 'text-gray-600'
                        }`}
                      >
                        {exCompleted}/{exercise.sets}
                      </span>
                    </div>
                    {/* Set pills */}
                    <div className="flex gap-1 mt-1 ml-3 flex-wrap">
                      {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNum) => {
                        const log = logs.find(
                          (l) => l.exerciseId === exercise.id && l.setNumber === setNum
                        );
                        const done = log?.completed;
                        return (
                          <span
                            key={setNum}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${
                              done
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-white/5 text-gray-600'
                            }`}
                          >
                            S{setNum}
                            {done && log ? (
                              <>
                                : {log.actualReps ?? '-'}
                                {log.actualWeight ? ` × ${log.actualWeight}kg` : ''}
                              </>
                            ) : (
                              <span className="text-gray-700"> —</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
