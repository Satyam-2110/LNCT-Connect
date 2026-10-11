import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CustomCursor } from './components/CustomCursor'
import { ScrollProgress } from './components/ScrollProgress'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPages'
import { HomePage } from './pages/HomePage'
import { PeoplePage } from './pages/PeoplePage'
import { ProfilePage } from './pages/ProfilePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { OpportunitiesPage } from './pages/OpportunitiesPage'
import { MentorshipPage } from './pages/MentorshipPage'
import { MessagesPage } from './pages/MessagesPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminPage } from './pages/AdminPage'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './lib/theme'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'

const Page = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

export default function App() {
  const location = useLocation()

  return (
    <ThemeProvider>
      <AuthProvider>
        <ScrollProgress />
        <CustomCursor />
        <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={
              <Page>
                <LandingPage />
              </Page>
            }
          />

          {/* Authentication Routes (Redirect to /home if already logged in) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Page>
                  <AuthPage mode="login" />
                </Page>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Page>
                  <AuthPage mode="signup" />
                </Page>
              </PublicOnlyRoute>
            }
          />

          {/* Protected Campus Routes (Requires authenticated session) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Page>
                  <HomePage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/people"
            element={
              <ProtectedRoute>
                <Page>
                  <PeoplePage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Page>
                  <ProfilePage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Page>
                  <ProjectsPage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <ProtectedRoute>
                <Page>
                  <OpportunitiesPage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship"
            element={
              <ProtectedRoute>
                <Page>
                  <MentorshipPage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Page>
                  <MessagesPage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Page>
                  <SettingsPage />
                </Page>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Page>
                  <AdminPage />
                </Page>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
    </ThemeProvider>
  )
}

