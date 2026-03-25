import React from 'react';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OperatorsPage from './pages/OperatorsPage';
import UsersPage from './pages/UsersPage';
import RequestsPage from './pages/RequestsPage';
import PricingPage from './pages/PricingPage';
import NotificationsPage from './pages/NotificationsPage';
import PaymentsPage from './pages/PaymentsPage';
import SupportPage from './pages/SupportPage';
import SettingsPage from './pages/SettingsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardLayout from './components/DashboardLayout';
import PageTransition from './components/PageTransition';
import type { AdminPermission } from './lib/rbac';

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthorizedRoute = ({
  permission,
  children,
}: {
  permission: AdminPermission;
  children: React.ReactNode;
}) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page - Public */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <PageTransition>
                <LandingPage />
              </PageTransition>
            )
          } 
        />
        
        {/* Login Page */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <PageTransition>
                <LoginPage />
              </PageTransition>
            )
          } 
        />
        
        {/* Dashboard Routes - Protected */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <AuthorizedRoute permission="dashboard.view">
                <DashboardPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="operators"
            element={
              <AuthorizedRoute permission="operators.view">
                <OperatorsPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="users"
            element={
              <AuthorizedRoute permission="users.view">
                <UsersPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="requests"
            element={
              <AuthorizedRoute permission="requests.view">
                <RequestsPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="pricing"
            element={
              <AuthorizedRoute permission="pricing.view">
                <PricingPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <AuthorizedRoute permission="notifications.view">
                <NotificationsPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="payments"
            element={
              <AuthorizedRoute permission="finance.view">
                <PaymentsPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="support"
            element={
              <AuthorizedRoute permission="support.view">
                <SupportPage />
              </AuthorizedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AuthorizedRoute permission="settings.view">
                <SettingsPage />
              </AuthorizedRoute>
            }
          />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AnimatedRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
