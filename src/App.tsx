import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoModeProvider } from './context/DemoModeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthScreen from './pages/AuthScreen';

// New HMI Phase 2 Shell & Pages
import HMIShell from './components/hmi/HMIShell';
import DriveScreen from './pages/hmi/DriveScreen';
import WorkScreen from './pages/hmi/WorkScreen';
import MachineScreen from './pages/hmi/MachineScreen';
import SafetyScreen from './pages/hmi/SafetyScreen';
import AssistScreen from './pages/hmi/AssistScreen';
import TrainingScreen from './pages/hmi/TrainingScreen';
import ShiftDebriefScreen from './pages/hmi/ShiftDebriefScreen';

// Legacy Layout & Pages (Preserved for Audit/Functionality)
import AppLayout from './components/layout/AppLayout';
import CommandCenter from './pages/CommandCenter';
import Tasks        from './pages/Tasks';
import Safety       from './pages/Safety';
import Machine      from './pages/Machine';
import AIInsights   from './pages/AIInsights';
import Training     from './pages/Training';
import ShiftReport  from './pages/ShiftReport';
import OperatorView from './pages/OperatorView';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoModeProvider>
          <Routes>
            {/* PUBLIC AUTHENTICATION ROUTE */}
            <Route path="/login" element={<AuthScreen />} />

            {/* PROTECTED ROUTES: Intercepted if not authenticated in memory */}
            <Route element={<ProtectedRoute />}>
              {/* NEW IN-CAB HMI SHELL ROUTING */}
              <Route element={<HMIShell />}>
                <Route index element={<DriveScreen />} />
                <Route path="drive" element={<DriveScreen />} />
                <Route path="work" element={<WorkScreen />} />
                <Route path="machine" element={<MachineScreen />} />
                <Route path="safety" element={<SafetyScreen />} />
                <Route path="assist" element={<AssistScreen />} />
                <Route path="training" element={<TrainingScreen />} />
                <Route path="shift-report" element={<ShiftDebriefScreen />} />
              </Route>

              {/* LEGACY DASHBOARD ROUTING (Preserved with AppLayout) */}
              <Route path="/legacy" element={<AppLayout />}>
                <Route index element={<CommandCenter />} />
                <Route path="machine" element={<Machine />} />
                <Route path="safety" element={<Safety />} />
              </Route>
              
              {/* OTHER LEGACY ROUTES */}
              <Route element={<AppLayout />}>
                <Route path="tasks"         element={<Tasks />}         />
                <Route path="insights"      element={<AIInsights />}    />
                <Route path="legacy/training"      element={<Training />}      />
                <Route path="legacy/shift"  element={<ShiftReport />}   />
                <Route path="legacy/operator"      element={<OperatorView />}  />
              </Route>
            </Route>

            {/* Catch-all redirect to root (which triggers ProtectedRoute check) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DemoModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
