import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import IntroPage from './pages/Intro/IntroPage';
import AuthPage from './pages/Auth/AuthPage';
import AppShell from './components/AppShell';
import SpyrixLoader from './components/SpyrixLoader.jsx';

function LoadingScreen() {
  return <SpyrixLoader />;
}

export default function App() {
  const { session, checking } = useAuth();
  if (checking) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/app/dashboard" replace /> : <IntroPage />} />
      <Route path="/login" element={session ? <Navigate to="/app/dashboard" replace /> : <AuthPage />} />
      <Route path="/register" element={session ? <Navigate to="/app/dashboard" replace /> : <AuthPage initialMode="register" />} />
      <Route path="/app/*" element={session ? <AppShell /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
