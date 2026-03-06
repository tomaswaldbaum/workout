import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, X, Pause, Play } from 'lucide-react';

interface RestTimerProps {
  /** Total rest duration in seconds */
  totalSeconds: number;
  /** Exercise name to display */
  exerciseName: string;
  /** Called when the timer is dismissed (manually or after finishing) */
  onDismiss: () => void;
}

/** Play a gentle beep using the Web Audio API */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Soft sine wave beep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

    // Gentle volume envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Second beep (slightly higher, softer)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1047, ctx.currentTime + 0.55); // C6

    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.55);
    gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.6);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);

    osc2.start(ctx.currentTime + 0.55);
    osc2.stop(ctx.currentTime + 1.1);

    // Cleanup after sounds finish
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Silently fail if audio is not available
  }
}

export default function RestTimer({ totalSeconds, exerciseName, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const hasBeepedRef = useRef(false);

  // Countdown logic
  useEffect(() => {
    if (paused || finished) return;

    if (remaining <= 0) {
      setFinished(true);
      if (!hasBeepedRef.current) {
        hasBeepedRef.current = true;
        playBeep();
      }
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, paused, finished]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 100;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 animate-slide-up">
      <div
        className={`relative overflow-hidden rounded-2xl p-4 ring-1 backdrop-blur-xl transition-all duration-500 ${
          finished
            ? 'bg-emerald-950/80 ring-emerald-500/30'
            : paused
              ? 'bg-amber-950/80 ring-amber-500/30'
              : 'bg-gray-950/90 ring-pink-500/20'
        }`}
      >
        {/* Progress bar background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              finished
                ? 'bg-emerald-500/10'
                : paused
                  ? 'bg-amber-500/5'
                  : 'bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-blue-500/10'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="relative flex items-center gap-3">
          {/* Timer icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              finished
                ? 'bg-emerald-500/20 text-emerald-400'
                : paused
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-pink-500/10 text-pink-400'
            }`}
          >
            <Timer size={20} className={!finished && !paused ? 'animate-pulse' : ''} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {finished ? 'descanso completo' : paused ? 'pausado' : 'descansando'}
            </p>
            <p className="text-xs text-gray-500 truncate">{exerciseName}</p>
          </div>

          {/* Countdown */}
          <div
            className={`font-mono text-2xl font-bold tabular-nums ${
              finished
                ? 'text-emerald-400'
                : remaining <= 5 && !paused
                  ? 'text-red-400 animate-pulse'
                  : paused
                    ? 'text-amber-400'
                    : 'text-white'
            }`}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>

          {/* Pause/Resume button */}
          {!finished && (
            <button
              onClick={togglePause}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                paused
                  ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                  : 'bg-white/5 text-gray-400 ring-1 ring-white/10 hover:bg-white/10'
              }`}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 ring-1 ring-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
