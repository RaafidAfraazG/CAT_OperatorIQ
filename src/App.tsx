import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClipboardList, Cpu, Shield, Brain } from 'lucide-react';

// New HMI Phase 2 Shell & Pages
import HMIShell from './components/hmi/HMIShell';
import DriveScreen from './pages/hmi/DriveScreen';
import WorkScreen from './pages/hmi/WorkScreen';
import MachineScreen from './pages/hmi/MachineScreen';
import SafetyScreen from './pages/hmi/SafetyScreen';
import AssistScreen from './pages/hmi/AssistScreen';
import TrainingScreen from './pages/hmi/TrainingScreen';
import ShiftDebriefScreen from './pages/hmi/ShiftDebriefScreen';
import DomainPlaceholder from './pages/hmi/DomainPlaceholder';

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
      <Routes>
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
        
        {/* OTHER LEGACY ROUTES inside HMIShell to show them without sidebars, or we can put them in AppLayout. 
            Since they are functional, let's keep them in AppLayout so they look correct. */}
        <Route element={<AppLayout />}>
          <Route path="tasks"         element={<Tasks />}         />
          <Route path="insights"      element={<AIInsights />}    />
          <Route path="legacy/training"      element={<Training />}      />
          <Route path="legacy/shift"  element={<ShiftReport />}   />
          <Route path="legacy/operator"      element={<OperatorView />}  />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
