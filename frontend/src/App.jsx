// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SessionHistoryPage } from './pages/SessionHistoryPage';
import { InterviewSelectionPage } from './pages/InterviewSelectionPage';
import { VideoInterviewPage } from './pages/VideoInterviewPage';
import { ChatInterviewPage } from './pages/ChatInterviewPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { QuestionsPage } from './pages/QuestionsPage';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Routes where navbar should be hidden (only interview taking pages)
const hideNavbarRoutes = ['/chat-interview/', '/video-interview/', '/interview/'];

const AuthenticatedLayout = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Check if current route should hide navbar
  let shouldHideNavbar = false;
  for (const route of hideNavbarRoutes) {
    // Only hide for exact interview sessions (with sessionId), not for /interview/select
    if (pathname.startsWith(route) && !pathname.includes('/select') && pathname.length > route.length) {
      shouldHideNavbar = true;
      break;
    }
  }
  
  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${!shouldHideNavbar ? 'pt-16' : ''}`}>
        {children}
      </main>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/onboarding" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <OnboardingPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <DashboardPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <ProfilePage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            <Route path="/sessions/history" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <SessionHistoryPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            <Route path="/interview/select" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <InterviewSelectionPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            
            {/* Video Interview Route - No Navbar */}
            <Route path="/video-interview/:sessionId" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <VideoInterviewPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            
            {/* Chat Interview Route - No Navbar */}
            <Route path="/chat-interview/:sessionId" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <ChatInterviewPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            
            {/* Fallback interview route - No Navbar */}
            <Route path="/interview/:sessionId" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <ChatInterviewPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            
            <Route path="/feedback/:sessionId" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <FeedbackPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
            <Route path="/questions" element={
              <PrivateRoute>
                <AuthenticatedLayout>
                  <QuestionsPage />
                </AuthenticatedLayout>
              </PrivateRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;