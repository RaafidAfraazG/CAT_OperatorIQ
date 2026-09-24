import { useState, useEffect } from 'react';
import { Shield, Timer, ClipboardList, Zap, Brain, Activity, Fuel, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { api } from '../api/client';

export default function OperatorView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const operators = await api.getOperators();
        if (operators.length === 0) throw new Error("No operators found");
        const selectedOp = operators[0].operator_id;

        // Fetch intelligent operator dashboard data
        const intelligenceData = await api.getOperatorIntelligence(selectedOp);
        // Also fetch regular operator info for shift hours/name
        const baseData = await api.getOperatorDashboard(selectedOp);
        
        setData({
          ...intelligenceData,
          operatorBase: baseData.operator,
          tasksCount: baseData.tasks.length
        });
      } catch (err) {
        setError('Unable to load operator intelligence data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center text-surface-400">Loading Operator Intelligence...</div>;
  if (error) return <div className="p-8 text-center text-status-critical">{error}</div>;
  if (!data) return null;

  const { operator_id, task_eta, machine, fuel, safety, insights, operatorBase, tasksCount } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={24} className="text-brand-400" />
            <h1 className="text-2xl font-bold text-surface-50">Operator Intelligence</h1>
          </div>
          <p className="text-sm text-surface-400 mt-1">
            Welcome back, <span className="text-surface-200 font-medium">{operatorBase?.name || 'Operator'}</span> ({operator_id})
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="badge badge-brand">AI Active</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-surface-800 to-surface-850">
          <div className="flex items-center gap-2 mb-2 text-surface-400">
            <ClipboardList size={16} />
            <span className="text-xs">Tasks Today</span>
          </div>
          <p className="text-2xl font-bold text-surface-50">{tasksCount}</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-surface-800 to-surface-850">
          <div className="flex items-center gap-2 mb-2 text-surface-400">
            <Shield size={16} />
            <span className="text-xs">Safety Status</span>
          </div>
          <p className={`text-lg font-bold uppercase ${safety?.risk_level === 'High' ? 'text-status-critical' : safety?.risk_level === 'Medium' ? 'text-status-warn' : 'text-status-safe'}`}>
            {safety?.risk_level === 'Low' ? 'SAFE TO OPERATE' : safety?.risk_level || 'Unknown'}
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface-800 to-surface-850">
          <div className="flex items-center gap-2 mb-2 text-surface-400">
            <Timer size={16} />
            <span className="text-xs">Shift Hours</span>
          </div>
          <p className="text-2xl font-bold text-surface-50">
            {operatorBase?.shift_hours_logged ? Math.round(operatorBase.shift_hours_logged) : 0} h
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-surface-800 to-surface-850">
          <div className="flex items-center gap-2 mb-2 text-surface-400">
            <Zap size={16} />
            <span className="text-xs">Machine Status</span>
          </div>
          <p className={`text-lg font-bold uppercase ${machine?.status === 'Attention' ? 'text-status-warn' : 'text-status-safe'}`}>
            {machine?.status || 'Unknown'}
          </p>
        </Card>
      </div>

      {/* AI Insights Section */}
      {insights && insights.length > 0 && (
        <section>
          <p className="section-label mb-3">AI Insights</p>
          <div className="space-y-3">
            {insights.map((insight: any, i: number) => (
              <Card key={i} className={`p-4 border-l-4 ${insight.severity === 'high' ? 'border-l-status-warn bg-status-warnD/5' : 'border-l-brand-400 bg-brand-500/5'}`}>
                <div className="flex items-start gap-3">
                  {insight.severity === 'high' ? (
                    <AlertTriangle size={18} className="text-status-warn mt-0.5 shrink-0" />
                  ) : (
                    <Brain size={18} className="text-brand-400 mt-0.5 shrink-0" />
                  )}
                  <p className={`text-sm ${insight.severity === 'high' ? 'text-surface-100 font-medium' : 'text-surface-200'}`}>
                    {insight.message}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* AI Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Task ETA */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Timer size={18} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-surface-100">AI Task ETA Prediction</h2>
          </div>
          {task_eta ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-surface-700">
                <div>
                  <p className="text-xs text-surface-400 mb-1">Expected Duration</p>
                  <p className="text-lg font-semibold">{task_eta.estimated_duration_min} min</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-surface-400 mb-1">Predicted Duration</p>
                  <p className={`text-lg font-semibold ${task_eta.status === 'likely_delayed' ? 'text-status-warn' : 'text-brand-400'}`}>
                    {task_eta.predicted_duration_min} min
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-surface-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {task_eta.status === 'likely_delayed' ? (
                    <AlertTriangle size={14} className="text-status-warn" />
                  ) : (
                    <CheckCircle2 size={14} className="text-status-safe" />
                  )}
                  <span className="text-sm font-medium capitalize">{task_eta.status.replace('_', ' ')}</span>
                  {task_eta.delay_minutes !== 0 && (
                    <span className="text-xs text-surface-400">({task_eta.delay_minutes > 0 ? '+' : ''}{task_eta.delay_minutes} min variance)</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-surface-400">No active task for ETA prediction.</p>
          )}
        </Card>

        {/* Machine Anomaly */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-surface-100">Machine Health Monitor</h2>
          </div>
          {machine ? (
            <div className="space-y-4">
               <div>
                  <p className="text-xs text-surface-400 mb-1">Anomaly Score</p>
                  <div className="flex items-end gap-2">
                    <p className={`text-2xl font-bold ${machine.anomaly_score > 0.6 ? 'text-status-warn' : 'text-status-safe'}`}>
                      {machine.anomaly_score}
                    </p>
                    <p className="text-xs text-surface-500 mb-1">/ 1.0</p>
                  </div>
               </div>
               
               {machine.status === 'Attention' && machine.reasons && machine.reasons.length > 0 && (
                 <div className="bg-status-warnD/10 border border-status-warn/20 rounded-lg p-3">
                   <p className="text-xs font-semibold text-status-warn mb-1.5">Detected Signatures:</p>
                   <ul className="list-disc list-inside text-xs text-surface-300 space-y-1">
                     {machine.reasons.map((r: string, i: number) => (
                       <li key={i}>{r}</li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          ) : (
            <p className="text-sm text-surface-400">No telemetry available.</p>
          )}
        </Card>

        {/* Fuel Efficiency */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Fuel size={18} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-surface-100">Fuel Efficiency</h2>
          </div>
          {fuel ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-surface-700">
                <div>
                  <p className="text-xs text-surface-400 mb-1">Expected Rate</p>
                  <p className="text-lg font-semibold">{fuel.expected_fuel_rate} L/h</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-surface-400 mb-1">Actual Rate</p>
                  <p className={`text-lg font-semibold ${fuel.status !== 'normal' ? 'text-status-warn' : 'text-status-safe'}`}>
                    {fuel.actual_fuel_rate} L/h
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                 <div>
                    <p className="text-xs text-surface-400 mb-1">Deviation</p>
                    <p className={`text-sm font-medium ${fuel.deviation_percent > 10 ? 'text-status-warn' : 'text-status-safe'}`}>
                      +{fuel.deviation_percent}%
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-surface-400 mb-1">Idle Fuel</p>
                    <p className="text-sm font-medium text-surface-300">{fuel.idle_fuel} L</p>
                 </div>
              </div>
            </div>
          ) : (
             <p className="text-sm text-surface-400">No fuel records available.</p>
          )}
        </Card>

        {/* Safety Breakdown */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-surface-100">Safety Profile</h2>
          </div>
          {safety ? (
            <div className="space-y-4">
               <div>
                  <p className="text-xs text-surface-400 mb-1">Risk Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-end gap-1">
                      <p className={`text-2xl font-bold ${safety.risk_level === 'high' || safety.risk_level === 'critical' ? 'text-status-warn' : 'text-status-safe'}`}>
                        {safety.risk_score}
                      </p>
                      <p className="text-xs text-surface-500 mb-1.5">/ 100</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      safety.risk_level === 'high' || safety.risk_level === 'critical' ? 'bg-status-warn/20 text-status-warn' : 'bg-status-safe/20 text-status-safe'
                    }`}>
                      {safety.risk_level}
                    </span>
                  </div>
               </div>
               
               <div>
                 <p className="text-xs font-semibold text-surface-200 mb-2">Contributing Factors:</p>
                 <div className="space-y-2">
                   {safety.factors?.map((f: any, i: number) => (
                     <div key={i} className="flex justify-between items-center bg-surface-800 p-2 rounded border border-surface-700">
                       <span className="text-xs text-surface-300">{f.factor}</span>
                       <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                         f.impact === 'high' ? 'bg-status-warn/20 text-status-warn' :
                         f.impact === 'medium' ? 'bg-status-info/20 text-status-info' :
                         'bg-status-safe/20 text-status-safe'
                       }`}>{f.impact} Impact</span>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          ) : (
            <p className="text-sm text-surface-400">No safety data available.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
