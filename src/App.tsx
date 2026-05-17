import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GoalSheetForm from './pages/GoalSheetForm';
import ApprovalDashboard from './pages/ApprovalDashboard';
import AchievementTracking from './pages/AchievementTracking';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Employee Routes */}
            <Route path="/goals/new" element={<ProtectedRoute allowedRoles={['employee']}><GoalSheetForm /></ProtectedRoute>} />
            <Route path="/goals/track" element={<ProtectedRoute allowedRoles={['employee']}><AchievementTracking /></ProtectedRoute>} />
            
            {/* Manager Routes */}
            <Route path="/manager/approvals" element={<ProtectedRoute allowedRoles={['manager']}><ApprovalDashboard /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}
