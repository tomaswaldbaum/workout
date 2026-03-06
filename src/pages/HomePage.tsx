import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, ChevronDown, ChevronUp, Zap, Dumbbell, ArrowDownUp, Flame, HelpCircle } from 'lucide-react';
import { db } from '../db/database';
import { timeAgo } from '../utils/formatters';

const DAY_THEMES: Record<number, { ring: string; glow: string; accent: string; icon: React.ReactNode }> = {
  1: { ring: 'ring-pink-500/20 hover:ring-pink-500/40', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(244,114,182,0.2)]', accent: 'text-pink-400', icon: <Zap size={20} /> },
  2: { ring: 'ring-violet-500/20 hover:ring-violet-500/40', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(167,139,250,0.2)]', accent: 'text-violet-400', icon: <ArrowDownUp size={20} /> },
  3: { ring: 'ring-sky-500/20 hover:ring-sky-500/40', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.2)]', accent: 'text-sky-400', icon: <Dumbbell size={20} /> },
  4: { ring: 'ring-amber-500/20 hover:ring-amber-500/40', glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.2)]', accent: 'text-amber-400', icon: <Flame size={20} /> },
};

export default function HomePage() {
  const routine = useLiveQuery(() => db.routines.toCollection().first());
  const days = useLiveQuery(() => db.routineDays.orderBy('dayNumber').toArray());
  const sessions = useLiveQuery(() =>
    db.workoutSessions.where('status').equals('completed').toArray()
  );
  const activeSession = useLiveQuery(() =>
    db.workoutSessions.where('status').equals('in-progress').first()
  );

  if (!routine || !days) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 text-sm">Cargando rutina...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* How to use */}
      <HowToUse />

      {/* Active session banner */}
      {activeSession && (
        <Link
          to={`/session/${activeSession.id}`}
          className="block rounded-xl p-4 transition-all ring-1 ring-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:ring-emerald-500/50"
        >
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="text-emerald-300 font-semibold text-sm">Sesión activa en curso</span>
              <p className="text-emerald-400/50 text-xs mt-0.5">Tocá para continuar</p>
            </div>
            <ChevronRight className="text-emerald-400/60" size={20} />
          </div>
        </Link>
      )}

      {/* Day cards */}
      <div className="grid gap-4">
        {days.map((day) => {
          const theme = DAY_THEMES[day.dayNumber] || DAY_THEMES[1];
          const lastSession = sessions
            ?.filter((s) => s.dayId === day.id && s.status === 'completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

          return (
            <Link
              key={day.id}
              to={`/day/${day.id}`}
              className={`group block rounded-xl bg-white/[0.02] ring-1 ${theme.ring} p-4 transition-all duration-300 hover:bg-white/[0.04] active:scale-[0.99] ${theme.glow}`}
            >
              <div className="flex items-start gap-3">
                <div className={`${theme.accent} mt-0.5 opacity-80`}>{theme.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.accent}`}>
                      Día {day.dayNumber}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={12} />
                      <span className="text-xs">{day.totalDuration} min</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">{day.name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{day.focus}</p>

                  {lastSession && (
                    <div className="mt-3 pt-2 border-t border-white/5">
                      <span className="text-xs text-gray-500">
                        Último: {timeAgo(lastSession.date)}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight size={20} className="text-gray-600 mt-1 shrink-0 group-hover:text-gray-400 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function HowToUse() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl ring-1 ring-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-pink-400 shrink-0" />
          <span className="text-sm font-medium text-gray-300">¿Cómo uso la app?</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 text-xs text-gray-400 space-y-2 border-t border-white/5 pt-2.5">
          <Step n={1} text="Elegí un día de la lista de abajo." />
          <Step n={2} text="Mirá los bloques y ejercicios del día. Tocá Iniciar para arrancar." />
          <Step n={3} text="Marcá cada set con el ✓ al completarlo. El siguiente set se resalta automáticamente." />
          <Step n={4} text="Ajustá reps y peso si difieren del plan. El timer de descanso arranca solo." />
          <Step n={5} text="Podés arrastrar bloques para cambiar el orden si necesitás reorganizar." />
          <Step n={6} text="Usá el botón ✓✓ para dar un bloque por terminado sin marcar cada set." />
          <Step n={7} text="Al terminar, tocá Finalizar Entrenamiento. ¡Confetti incluido!" />
          <p className="text-gray-500 pt-1 italic">Revisá tu progreso en la pestaña Historial.</p>
        </div>
      )}
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-pink-400/80 font-bold shrink-0">{n}.</span>
      <span>{text}</span>
    </div>
  );
}
