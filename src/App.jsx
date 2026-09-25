import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; 
import AuthPage from './pages/AuthPage';
import Lobby from './pages/Lobby';
import RoomPage from './pages/RoomPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="bg-black min-h-screen"></div>;
  return user ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              } />
              <Route path="/room/:code" element={
                <ProtectedRoute>
                  <RoomPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
