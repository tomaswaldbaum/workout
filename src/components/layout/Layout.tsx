import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BarChart3 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const activeSession = useLiveQuery(() =>
    db.workoutSessions.where('status').equals('in-progress').first()
  );

  const isSessionPage = location.pathname.startsWith('/session');

  return (
    <div className="min-h-screen bg-radiant text-white flex flex-col">
      {/* Header */}
      {!isSessionPage && (
        <header className="bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-center sticky top-0 z-50">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Dumbbell size={20} className="text-pink-400" />
            <span className="text-radiant">
              Workout Tracker
            </span>
          </h1>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-xl border-t border-white/5 flex justify-around py-2 px-4 safe-bottom z-50">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={22} />
          <span className="text-xs">Rutina</span>
        </NavLink>

        {activeSession ? (
          <NavLink
            to={`/session/${activeSession.id}`}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="relative">
              <Dumbbell size={22} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <span className="text-xs">Entreno</span>
          </NavLink>
        ) : (
          <div className="nav-link opacity-30 cursor-default">
            <Dumbbell size={22} />
            <span className="text-xs">Entreno</span>
          </div>
        )}

        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={22} />
          <span className="text-xs">Historial</span>
        </NavLink>
      </nav>
    </div>
  );
}
