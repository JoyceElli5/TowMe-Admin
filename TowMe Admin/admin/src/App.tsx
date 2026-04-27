import React, { Suspense, lazy } from 'react';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardLayout from './components/DashboardLayout';
import PageTransition from './components/PageTransition';
import type { AdminPermission } from './lib/rbac';

const queryClient = new QueryClient();

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OperatorsPage = lazy(() => import('./pages/OperatorsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
    return <RouteFallback />;
  }

  const renderRoute = (element: React.ReactNode) => (
    <Suspense fallback={<RouteFallback />}>
      <PageTransition>{element}</PageTransition>
    </Suspense>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page - Public */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" replace /> : renderRoute(<LandingPage />)
          } 
        />
        
        {/* Login Page */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : renderRoute(<LoginPage />)
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
                <Suspense fallback={<RouteFallback />}>
                  <DashboardPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="operators"
            element={
              <AuthorizedRoute permission="operators.view">
                <Suspense fallback={<RouteFallback />}>
                  <OperatorsPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="users"
            element={
              <AuthorizedRoute permission="users.view">
                <Suspense fallback={<RouteFallback />}>
                  <UsersPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="requests"
            element={
              <AuthorizedRoute permission="requests.view">
                <Suspense fallback={<RouteFallback />}>
                  <RequestsPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="pricing"
            element={
              <AuthorizedRoute permission="pricing.view">
                <Suspense fallback={<RouteFallback />}>
                  <PricingPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <AuthorizedRoute permission="notifications.view">
                <Suspense fallback={<RouteFallback />}>
                  <NotificationsPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="payments"
            element={
              <AuthorizedRoute permission="finance.view">
                <Suspense fallback={<RouteFallback />}>
                  <PaymentsPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="support"
            element={
              <AuthorizedRoute permission="support.view">
                <Suspense fallback={<RouteFallback />}>
                  <SupportPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AuthorizedRoute permission="settings.view">
                <Suspense fallback={<RouteFallback />}>
                  <SettingsPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <AuthorizedRoute permission="audit.view">
                <Suspense fallback={<RouteFallback />}>
                  <AuditLogsPage />
                </Suspense>
              </AuthorizedRoute>
            }
          />
          <Route
            path="unauthorized"
            element={
              <Suspense fallback={<RouteFallback />}>
                <UnauthorizedPage />
              </Suspense>
            }
          />
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
