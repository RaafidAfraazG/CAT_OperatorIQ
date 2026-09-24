import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mic, MicOff, Send, Loader2, Target, Settings, Shield, BookOpen, Clock, Activity, ChevronRight, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { api } from '../../api/client';
import { useDemoMode } from '../../context/DemoModeContext';

export default function AssistScreen() {
  const navigate = useNavigate();
  const { isDemoMode, demoState } = useDemoMode();

  // Global Context
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string>('');
  
  // Context Data
  const [task, setTask] = useState<any>(null);
  const [machine, setMachine] = useState<any>(null);
  const [safetyRisk, setSafetyRisk] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [training, setTraining] = useState<any>(null);
  
  // Use mock shift data since there is no shift endpoint
  const shift = { shift_duration: 4.3, fuel_baseline: 15.2 };

  // Chat State
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('operatoriq_voice_muted') === 'true';
  });

  const toggleMute = () => {
    setIsMuted(prev => {
      const nextVal = !prev;
      localStorage.setItem('operatoriq_voice_muted', String(nextVal));
      if (nextVal && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return nextVal;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Handle incoming contextual question
  useEffect(() => {
    if (loading || !operatorId) return; // Wait until system is ready

    const question = searchParams.get('question');
    const autoSubmit = location.state?.autoSubmit || searchParams.get('autoSubmit') === 'true';

    if (!question || !autoSubmit) return;
    if (autoSubmittedRef.current) return;

    console.log('[ASSIST RECEIVED]');
    console.log('question:', question);
    console.log('autoSubmit:', autoSubmit);

    autoSubmittedRef.current = true;
    
    // Clean URL but do it without unmounting or cancelling the effect
    setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('question');
      newParams.delete('autoSubmit');
      setSearchParams(newParams, { replace: true });
    }, 0);

    // Submit
    submitQuestion(question);
  }, [searchParams, location.state, loading, operatorId]);

  useEffect(() => {
    async function loadData() {
      try {
        const ops = await api.getOperators();
        if (!ops || ops.length === 0) throw new Error("No operator context");
        const opId = ops[0].operator_id;
        setOperatorId(opId);

        // Load parallel context
        const [tasksRes, machinesRes, riskRes, intelRes, trainRes] = await Promise.allSettled([
          api.getTasks(),
          api.getMachines(),
          api.getSafetyRisk(opId),
          api.getOperatorIntelligence(opId),
          api.getTrainingProgress(opId)
        ]);

        let activeMachine = machinesRes.status === 'fulfilled' && machinesRes.value.length > 0 ? machinesRes.value[0] : null;
        if (tasksRes.status === 'fulfilled' && tasksRes.value.length > 0) {
          const activeTask = tasksRes.value[0];
          setTask(activeTask);
          if (machinesRes.status === 'fulfilled' && activeTask.machine_id) {
            const matched = machinesRes.value.find((m: any) => m.machine_id === activeTask.machine_id);
            if (matched) activeMachine = matched;
          }
        }

        if (activeMachine) {
          let populatedMachine = { ...activeMachine };
          try {
            const telData = await api.getTelemetry(activeMachine.machine_id, 1);
            if (telData && telData.length > 0) {
              const latestTel = telData[0];
              populatedMachine = {
                ...populatedMachine,
                fuel_percent: latestTel.fuel_level_percent,
                fuelPercent: latestTel.fuel_level_percent,
                fuel_rate: latestTel.fuel_rate_lph,
                fuelRate: latestTel.fuel_rate_lph,
                engine_rpm: latestTel.engine_rpm,
                engineRpm: latestTel.engine_rpm,
                engine_load: latestTel.engine_load_percent,
                engineLoad: latestTel.engine_load_percent,
                speed: latestTel.machine_speed_kmh,
              };
            }
          } catch {
            // Keep machine specs if telemetry fetch fails
          }
          setMachine(populatedMachine);
        }
        if (riskRes.status === 'fulfilled') setSafetyRisk(riskRes.value);
        if (intelRes.status === 'fulfilled') setInsights(intelRes.value?.insights || []);
        if (trainRes.status === 'fulfilled') setTraining(trainRes.value);

      } catch (err) {
        console.error('Failed to load ASSIST data:', err);
        setErrorState("ASSIST CONNECTION ERROR");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const submitQuestion = async (questionText: string) => {
    const text = questionText.trim();
    if (!text || !operatorId) {
        console.log('[ASSIST SUBMIT ABORTED] text or operatorId missing', { text, operatorId });
        return;
    }

    console.log('[ASSIST SUBMIT]');
    console.log('question:', text);

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);
    setErrorState(null);

    try {
      const fuelLevelVal = isDemoMode 
        ? demoState.telemetry.fuelLvl.toFixed(1) 
        : (machine?.fuel_percent ?? machine?.fuelPercent ?? 'UNAVAILABLE');
      const fuelRateVal = isDemoMode 
        ? demoState.telemetry.fuelRate.toFixed(1) 
        : (machine?.fuel_rate ?? machine?.fuelRate ?? 'UNAVAILABLE');
      const engineRpmVal = isDemoMode 
        ? Math.round(demoState.telemetry.rpm) 
        : (machine?.engine_rpm ?? machine?.engineRpm ?? 'UNAVAILABLE');
      const engineLoadVal = isDemoMode 
        ? Math.round(demoState.telemetry.loadPct) 
        : (machine?.engine_load ?? machine?.engineLoad ?? 'UNAVAILABLE');
      const speedVal = isDemoMode 
        ? demoState.telemetry.speed.toFixed(1) 
        : (machine?.speed ?? 'UNAVAILABLE');

      const currentTaskType = isDemoMode 
        ? demoState.task.taskTitle 
        : (task?.task_type ? task.task_type.replace(/_/g, ' ') : 'UNASSIGNED');
      const currentTaskProgress = isDemoMode 
        ? Math.round(demoState.task.progressPct) 
        : (task?.completion_percent ?? 0);
      const currentTaskPredicted = isDemoMode 
        ? `${demoState.task.predictedMin} min (delay: ${demoState.task.varianceMin} min)` 
        : `${task?.estimated_duration_min ?? 'UNAVAILABLE'} min`;

      const currentSafetyState = isDemoMode 
        ? demoState.safety.globalStateText 
        : (safetyRisk?.risk_level || 'UNKNOWN');
      const currentSafetyRisk = isDemoMode 
        ? `${demoState.safety.riskScore}` 
        : `${safetyRisk?.risk_score ?? 'UNKNOWN'}`;
      const currentNearestHazard = isDemoMode 
        ? (demoState.safety.isCritical 
            ? `PROXIMITY HAZARD: GROUND WORKER WITHIN ${demoState.safety.nearestDistance.toFixed(1)}M` 
            : demoState.safety.isCaution 
            ? `OBJECT WITHIN ${demoState.safety.nearestDistance.toFixed(1)}M` 
            : 'NONE — AREA CLEAR')
        : (insights?.[0]?.message || 'NONE');

      const contextStr = `
CURRENT MACHINE CONTEXT

Machine: ${isDemoMode ? 'EX-140GC' : (machine?.machine_model || 'UNKNOWN')}
Status: ${isDemoMode ? (demoState.telemetry.loadPct > 85 ? 'Attention' : 'NORMAL') : (machine?.status || 'UNKNOWN')}

Fuel level: ${fuelLevelVal}${fuelLevelVal !== 'UNAVAILABLE' ? '%' : ''}
Fuel rate: ${fuelRateVal}${fuelRateVal !== 'UNAVAILABLE' ? ' L/h' : ''}
Ground speed: ${speedVal}${speedVal !== 'UNAVAILABLE' ? ' km/h' : ''}
Engine RPM: ${engineRpmVal}
Engine load: ${engineLoadVal}${engineLoadVal !== 'UNAVAILABLE' ? '%' : ''}

Current task: ${currentTaskType}
Task progress: ${currentTaskProgress}%
Predicted duration: ${currentTaskPredicted}

Safety state: ${currentSafetyState}
Safety risk: ${currentSafetyRisk}
Nearest hazard: ${currentNearestHazard}

Use this current machine context when answering operator questions.
If the operator asks for a value that exists here, answer directly using it.
Do not claim the value is unavailable when it is present.
Distinguish between measurements with similar names.
If a requested value genuinely does not exist, say so clearly.

OPERATOR QUESTION:
${text}
`;

      console.log('[AI CONTEXT]');
      console.log(`machine.fuelPercent = ${fuelLevelVal}`);
      console.log(`machine.fuelRate = ${fuelRateVal}`);
      console.log(`machine.engineLoad = ${engineLoadVal}`);
      console.log(`machine.engineRpm = ${engineRpmVal}`);
      console.log('[AI QUESTION]');
      console.log(text);
      console.log('[AI REQUEST] sending to backend...');
      
      const response = await api.chatWithAssistant(contextStr, operatorId, {
        fuelPercent: isDemoMode ? demoState.telemetry.fuelLvl : (machine?.fuel_percent ?? machine?.fuelPercent),
        fuelRate: isDemoMode ? demoState.telemetry.fuelRate : (machine?.fuel_rate ?? machine?.fuelRate),
        engineRpm: isDemoMode ? demoState.telemetry.rpm : (machine?.engine_rpm ?? machine?.engineRpm),
        engineLoad: isDemoMode ? demoState.telemetry.loadPct : (machine?.engine_load ?? machine?.engineLoad),
        speed: isDemoMode ? demoState.telemetry.speed : machine?.speed,
      });
      
      console.log('[AI RESPONSE]');
      const reply = response.response || "I'm unable to formulate a response.";
      console.log(reply);
      
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Text-to-Speech (only if voice output is not muted)
      if (!isMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("[AI ERROR] Chat error", error);
      setErrorState("AI UNAVAILABLE");
      setMessages(prev => [...prev, { role: 'assistant', content: "SYSTEM ERROR: Cannot connect to AI backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (input) submitQuestion(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorState("VOICE INPUT UNAVAILABLE");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      setErrorState(null);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => submitQuestion(transcript), 500);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorState("MICROPHONE PERMISSION REQUIRED");
      } else {
        setErrorState("VOICE INPUT ERROR");
      }
    };
    
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (err) {
      setErrorState("VOICE SYSTEM BUSY");
    }
  };

  if (loading) {
    return (
      <div className="h-full min-h-0 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none overflow-hidden">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4] animate-pulse">CONNECTING OPERATOR ASSIST</p>
      </div>
    );
  }

  // Derive contextual suggested questions
  const suggestions = ["WHAT SHOULD I WATCH FOR?"];
  if (isDemoMode) {
    if (demoState.safety.isCritical) {
      suggestions.unshift("WHAT IS THE CRITICAL SAFETY HAZARD?");
    }
    if (demoState.task.isDelayed) {
      suggestions.unshift("WHY IS MY TASK DELAYED?");
    }
    if (demoState.telemetry.loadPct > 80) {
      suggestions.unshift("EXPLAIN THE CURRENT MACHINE LOAD");
    }
  } else {
    if (task && (task.task_status === 'DELAYED' || task.task_status === 'Delayed')) {
      suggestions.unshift("WHY IS MY TASK DELAYED?");
    }
    if (machine && (machine.status === 'Attention' || machine.status === 'Critical')) {
      suggestions.unshift("EXPLAIN THE MACHINE ANOMALY");
    }
    if (safetyRisk && (safetyRisk.risk_level === 'High' || safetyRisk.risk_level === 'high' || safetyRisk.risk_level === 'critical')) {
      suggestions.unshift("WHAT IS THE CRITICAL SAFETY HAZARD?");
    }
  }

  const primaryInsight = insights.length > 0 ? insights[0] : null;
  const isSafetyCritical = isDemoMode 
    ? demoState.safety.isCritical 
    : (safetyRisk?.risk_level === 'High' || safetyRisk?.risk_level === 'high' || safetyRisk?.risk_level === 'critical');

  const displayTaskTitle = isDemoMode ? demoState.task.taskTitle : (task?.task_type?.replace(/_/g, ' ') || 'UNASSIGNED');
  const displayTaskProgress = isDemoMode ? Math.round(demoState.task.progressPct) : (task?.task_efficiency ? Math.round(task.task_efficiency * 100) : 0);

  const displayMachineModel = isDemoMode ? 'EX-140GC' : (machine?.machine_model || 'UNK');
  const displayMachineStatus = isDemoMode ? (demoState.telemetry.loadPct > 85 ? 'Attention' : 'NORMAL') : (machine?.status || 'NORMAL');
  const displayMachineColor = isDemoMode 
    ? (demoState.telemetry.loadPct > 85 ? 'text-[#F2B84B]' : 'text-[#42C76A]')
    : (machine?.status === 'Critical' ? 'text-[#E5484D]' : machine?.status === 'Attention' ? 'text-[#F2B84B]' : 'text-[#42C76A]');

  const displaySafetyText = isDemoMode ? demoState.safety.globalStateText : (safetyRisk?.risk_level === 'High' ? 'CRITICAL HAZARD' : safetyRisk?.risk_level === 'Medium' ? 'CAUTION' : 'SAFE TO OPERATE');
  const displaySafetyColor = isDemoMode ? demoState.safety.globalStateColor : (safetyRisk?.risk_level === 'High' ? 'text-[#E5484D]' : safetyRisk?.risk_level === 'Medium' ? 'text-[#F2B84B]' : 'text-[#42C76A]');

  const displayInsight = isDemoMode
    ? {
        severity: demoState.safety.isCritical ? 'CRITICAL' : demoState.telemetry.loadPct > 80 ? 'HIGH LOAD' : 'NOMINAL',
        message: demoState.safety.isCritical
          ? `Safety breach active: Ground personnel detected within ${demoState.safety.nearestDistance.toFixed(1)}m. Halt swinging immediately.`
          : demoState.telemetry.loadPct > 80
          ? `Excavation load at ${Math.round(demoState.telemetry.loadPct)}%. Fuel consumption rate burning at ${demoState.telemetry.fuelRate.toFixed(1)} L/h.`
          : `Nominal duty cycle. Engine RPM at ${Math.round(demoState.telemetry.rpm)} with ${Math.round(demoState.telemetry.fuelLvl)}% diesel.`
      }
    : primaryInsight;

  const displayShiftDuration = isDemoMode ? demoState.shiftDebrief.shiftDuration : (shift?.shift_duration ? `${shift.shift_duration} HRS` : '0.0 HRS');
  const displayFuelBaseline = isDemoMode ? `${demoState.shiftDebrief.expectedFuelRate} L/H` : `${shift?.fuel_baseline || 0} L/H`;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none px-4 py-2 lg:py-4 lg:px-12 overflow-hidden">
      
      {/* CRITICAL SAFETY OVERRIDE BANNER */}
      {isSafetyCritical && (
        <div className="w-full bg-[#E5484D] text-[#080A0B] p-4 flex items-center justify-between font-mono font-bold uppercase tracking-widest mb-6">
          <div className="flex items-center gap-4">
            <AlertTriangle size={24} />
            <div className="flex flex-col">
              <span className="text-sm">CRITICAL SAFETY EVENT ACTIVE</span>
              <span className="text-[10px] opacity-80">
                {isDemoMode 
                  ? `GROUND WORKER WITHIN ${demoState.safety.nearestDistance.toFixed(1)}M — SEE SAFETY SCREEN FOR RADAR`
                  : 'SEE SAFETY SCREEN FOR FULL PROXIMITY RADAR'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => submitQuestion("Explain the current critical safety hazard")}
            className="border border-[#080A0B] px-4 py-2 hover:bg-[#080A0B] hover:text-[#E5484D] transition-colors"
          >
            EXPLAIN HAZARD →
          </button>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 lg:gap-8 h-full min-h-0 pb-2 lg:pb-4">
        
        {/* LEFT COLUMN: AI INTERACTION */}
        <div className="flex flex-col h-full min-h-0 pr-0 lg:pr-8 border-r-0 lg:border-r border-[#141819]">
          
          <div className="flex items-center gap-4 mb-6 shrink-0">
            <div className="w-2 h-2 bg-[#FFCC00] rounded-full animate-pulse" />
            <span className="font-mono text-sm tracking-widest text-[#F1F3F4] uppercase font-bold">
              OPERATORIQ ASSIST
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={toggleMute}
                title={isMuted ? "Click to enable voice output" : "Click to mute voice output"}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold tracking-widest uppercase border transition-colors ${
                  isMuted 
                    ? 'border-[#E5484D]/50 text-[#E5484D] bg-[#E5484D]/10 hover:bg-[#E5484D]/20' 
                    : 'border-[#42C76A]/50 text-[#42C76A] bg-[#42C76A]/10 hover:bg-[#42C76A]/20'
                }`}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isMuted ? "VOICE MUTED" : "VOICE ON"}</span>
              </button>
              {errorState && (
                <span className="font-mono text-xs tracking-widest text-[#E5484D] uppercase font-bold">
                  {errorState}
                </span>
              )}
            </div>
          </div>

          {/* RESPONSE AREA */}
          <div className="flex-1 overflow-y-auto scrollbar-thin mb-6 flex flex-col gap-6 font-mono pr-4">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-4 text-[#929A9E] mt-auto">
                <span className="text-2xl font-bold text-[#F1F3F4] tracking-tight uppercase">WHAT DO YOU NEED?</span>
                <span className="text-sm tracking-widest uppercase">ASK ABOUT YOUR MACHINE, TASK, SAFETY, OR SHIFT.</span>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'assistant' && (
                    <span className="text-[10px] text-[#5E676C] font-bold tracking-widest uppercase mb-2">OPERATORIQ</span>
                  )}
                  {msg.role === 'user' && (
                    <span className="text-[10px] text-[#5E676C] font-bold tracking-widest uppercase mb-2">OPERATOR</span>
                  )}
                  <div className={`max-w-[85%] text-sm leading-relaxed tracking-wide ${msg.role === 'user' ? 'text-[#929A9E] text-right' : 'text-[#F1F3F4]'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex flex-col items-start mt-4">
                <span className="text-[10px] text-[#5E676C] font-bold tracking-widest uppercase mb-2">OPERATORIQ</span>
                <div className="flex gap-2 text-[#FFCC00]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs uppercase tracking-widest">ANALYZING...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED ACTIONS */}
          <div className="flex flex-wrap gap-2 mb-6 shrink-0">
            {suggestions.slice(0, 3).map((sugg, i) => (
              <button
                key={i}
                onClick={() => submitQuestion(sugg)}
                className="px-4 py-2 border border-[#141819] font-mono text-xs font-bold tracking-widest text-[#929A9E] hover:text-[#FFCC00] hover:border-[#FFCC00] transition-colors"
              >
                {sugg}
              </button>
            ))}
          </div>

          {/* INPUT AREA */}
          <div className="flex gap-3 shrink-0 mt-auto">
            <button
              onClick={toggleListen}
              title={isListening ? "Listening..." : "Voice input"}
              className={`w-16 h-16 shrink-0 flex items-center justify-center rounded-none border transition-colors ${
                isListening 
                  ? 'bg-[#FFCC00] border-[#FFCC00] text-[#080A0B]' 
                  : 'bg-[#0D1011] border-[#141819] text-[#F1F3F4] hover:border-[#5E676C]'
              }`}
            >
              {isListening ? <Mic size={24} className="animate-pulse" /> : <Mic size={24} />}
            </button>
            <button
              onClick={toggleMute}
              title={isMuted ? "Voice is Muted. Click to Unmute" : "Voice is On. Click to Mute"}
              className={`w-16 h-16 shrink-0 flex flex-col items-center justify-center gap-1 rounded-none border transition-colors ${
                isMuted 
                  ? 'bg-[#E5484D]/10 border-[#E5484D]/60 text-[#E5484D] hover:bg-[#E5484D]/20' 
                  : 'bg-[#0D1011] border-[#141819] text-[#42C76A] hover:border-[#5E676C]'
              }`}
            >
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              <span className="font-mono text-[9px] font-bold tracking-widest uppercase">
                {isMuted ? 'MUTED' : 'VOICE'}
              </span>
            </button>
            <div className="flex-1 flex bg-[#0D1011] border border-[#141819] focus-within:border-[#5E676C] transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "LISTENING..." : "TYPE A QUESTION"}
                className="flex-1 bg-transparent border-none text-[#F1F3F4] font-mono text-sm tracking-widest px-6 focus:outline-none placeholder:text-[#5E676C]"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="px-6 text-[#929A9E] hover:text-[#FFCC00] disabled:opacity-30 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTEXT & INSIGHTS */}
        <div className="flex flex-col h-full min-h-0 pb-4">
          
          {/* Scrollable upper area to prevent lower items from being pushed out */}
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scrollbar-none pr-2">
            
            {/* CURRENT CONTEXT */}
            <div className="flex flex-col gap-4 mb-6 shrink-0">
              <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
              CURRENT CONTEXT
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-3 border border-[#141819]">
                <div className="flex items-center gap-2 text-[#5E676C] mb-1">
                  <Target size={12} />
                  <span className="font-mono text-[10px] tracking-widest uppercase font-bold">TASK</span>
                </div>
                <span className="font-mono text-xs text-[#F1F3F4] font-bold uppercase truncate">{displayTaskTitle}</span>
                <span className="font-mono text-xs text-[#929A9E]">{displayTaskProgress}%</span>
              </div>
              
              <div className="flex flex-col gap-1 p-3 border border-[#141819]">
                <div className="flex items-center gap-2 text-[#5E676C] mb-1">
                  <Settings size={12} />
                  <span className="font-mono text-[10px] tracking-widest uppercase font-bold">MACHINE</span>
                </div>
                <span className="font-mono text-xs text-[#F1F3F4] font-bold uppercase truncate">{displayMachineModel}</span>
                <span className={`font-mono text-xs font-bold uppercase ${displayMachineColor}`}>
                  {displayMachineStatus}
                </span>
              </div>

              <div className="flex flex-col gap-1 p-3 border border-[#141819] col-span-2">
                <div className="flex items-center gap-2 text-[#5E676C] mb-1">
                  <Shield size={12} />
                  <span className="font-mono text-[10px] tracking-widest uppercase font-bold">SAFETY</span>
                </div>
                <span className={`font-mono text-xs font-bold uppercase ${displaySafetyColor}`}>
                  {displaySafetyText}
                </span>
              </div>
            </div>
          </div>

            {/* OPERATIONAL INSIGHTS */}
            <div className="flex flex-col gap-4 mb-6 shrink-0">
              <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
                OPERATIONAL INSIGHT
              </span>
              {displayInsight ? (
                <div className="p-4 border border-[#FFCC00]/30 bg-[#FFCC00]/5 flex flex-col gap-2">
                  <span className="font-mono text-xs text-[#FFCC00] font-bold tracking-widest uppercase">
                    {displayInsight.severity || 'PRIORITY'} INSIGHT
                  </span>
                  <span className="font-mono text-sm text-[#F1F3F4] leading-relaxed">
                    {displayInsight.message}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-sm text-[#929A9E] tracking-widest uppercase">
                  NO NEW OPERATIONAL INSIGHTS
                </span>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-[#141819] mb-6 shrink-0" />

          {/* TRAINING & SHIFT DEBRIEF - Fixed Height Area */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6 shrink-0 h-[190px]">
            
            {/* TRAINING */}
            <div className="flex flex-col h-full border border-[#141819] p-4 relative group hover:border-[#5E676C] transition-colors cursor-pointer" onClick={() => navigate('/training')}>
              <div className="flex items-center gap-2 text-[#5E676C] mb-4">
                <BookOpen size={14} />
                <span className="font-mono text-[10px] tracking-widest uppercase font-bold">TRAINING</span>
              </div>
              <span className="font-mono text-xs text-[#929A9E] uppercase font-bold mb-1">SKILL LEVEL</span>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-mono text-3xl font-extrabold text-[#F1F3F4]">{training?.current_skill_progress || 0}%</span>
              </div>
              
              <span className="font-mono text-xs text-[#929A9E] uppercase font-bold mb-1">NEXT REC</span>
              <span className="font-mono text-sm text-[#F1F3F4] uppercase font-bold line-clamp-2">
                {training?.recommended_modules?.[0]?.module_name || 'GENERAL OPERATIONS'}
              </span>
              
              <div className="mt-auto pt-4 font-mono text-xs font-bold tracking-widest text-[#FFCC00] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>VIEW TRAINING</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* SHIFT DEBRIEF */}
            <div className="flex flex-col h-full border border-[#141819] p-4 relative group hover:border-[#5E676C] transition-colors cursor-pointer" onClick={() => navigate('/shift-report')}>
              <div className="flex items-center gap-2 text-[#5E676C] mb-4">
                <Clock size={14} />
                <span className="font-mono text-[10px] tracking-widest uppercase font-bold">SHIFT DEBRIEF</span>
              </div>
              
              <span className="font-mono text-xs text-[#929A9E] uppercase font-bold mb-1">DURATION</span>
              <span className="font-mono text-xl text-[#F1F3F4] font-bold mb-4 uppercase">
                {displayShiftDuration}
              </span>

              <span className="font-mono text-xs text-[#929A9E] uppercase font-bold mb-1">FUEL BASELINE</span>
              <span className="font-mono text-sm text-[#F1F3F4] uppercase font-bold">
                {displayFuelBaseline}
              </span>
              
              <div className="mt-auto pt-4 font-mono text-xs font-bold tracking-widest text-[#FFCC00] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>VIEW SHIFT REPORT</span>
                <ChevronRight size={12} />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
