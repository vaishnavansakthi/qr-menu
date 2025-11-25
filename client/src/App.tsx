import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { Menu } from './pages/Menu';

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Shop URL route */}
          <Route path="/shop/:shopId" element={<Menu />} />

          <Route path="/menu/:shopId" element={<Menu />} />

          {/* Redirect home to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes */}
          <Route path="/super-admin" element={
            <PrivateRoute roles={['super_admin']}>
              <SuperAdminDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
