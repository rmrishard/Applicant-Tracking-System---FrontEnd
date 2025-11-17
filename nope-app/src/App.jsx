import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';
import Companies from './pages/companies/Companies';
import CompanyDetail from './pages/companies/CompanyDetail';
import Jobs from './pages/jobs/Jobs';
import JobDetail from './pages/jobs/JobDetail';
import Candidates from './pages/candidates/Candidates';
import CandidateDetail from './pages/candidates/CandidateDetail';
import Applications from './pages/applications/Applications';
import ApplicationDetail from './pages/applications/ApplicationDetail';
import ApplicationsKanban from './pages/applications/ApplicationsKanban';
import Users from './pages/users/Users';
import Profile from './pages/profile/Profile';
import Analytics from './pages/analytics/Analytics';

// Error pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes with dashboard layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Companies />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CompanyDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Jobs />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/jobs/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <JobDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/candidates"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Candidates />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/candidates/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CandidateDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Applications />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/applications/kanban"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ApplicationsKanban />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/applications/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ApplicationDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <DashboardLayout>
                    <Users />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Analytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
