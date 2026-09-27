import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { OperationsPage } from './pages/OperationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WeatherPage } from './pages/WeatherPage';
import { SocialPage } from './pages/SocialPage';
import { NugenPage } from './pages/NugenPage';

import { TutorialProvider } from './tutorial/TutorialContext';
import { TutorialOverlay } from './tutorial/TutorialOverlay';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TutorialProvider>
          <TutorialOverlay />
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CommandCenterPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/digital-twin"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DigitalTwinPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/predictions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PredictionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulator"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SimulatorPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/operations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <OperationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WeatherPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SocialPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AlertsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nugen"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NugenPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </TutorialProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
