import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import RoutineDayPage from './pages/RoutineDayPage';
import WorkoutSessionPage from './pages/WorkoutSessionPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/day/:dayId" element={<RoutineDayPage />} />
          <Route path="/session/:sessionId" element={<WorkoutSessionPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
