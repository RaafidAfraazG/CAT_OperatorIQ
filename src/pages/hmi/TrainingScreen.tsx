import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, CheckCircle2, ChevronRight, Award, AlertTriangle, X, ShieldCheck, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '../../api/client';

export default function TrainingScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string>('');
  
  const [trainingData, setTrainingData] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [activeVideoModule, setActiveVideoModule] = useState<any>(null);
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const ops = await api.getOperators();
        if (!ops || ops.length === 0) return;
        const opId = ops[0].operator_id;
        setOperatorId(opId);

        const [progressRes, modulesRes] = await Promise.allSettled([
          api.getTrainingProgress(opId),
          api.getTrainingModules()
        ]);

        if (progressRes.status === 'fulfilled') setTrainingData(progressRes.value);
        if (modulesRes.status === 'fulfilled') setModules(modulesRes.value);

      } catch (err) {
        console.error('Failed to load training data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectModule = (mod: any) => {
    if (selectedModule?.module_name === mod.module_name) {
      // Toggle if already selected or keep active
      setSelectedModule(mod);
    } else {
      setSelectedModule(mod);
    }
  };

  const handleStartModule = (mod: any) => {
    setActiveVideoModule(mod);
    setVideoCompleted(false);
  };

  const handleCompleteTraining = () => {
    if (!activeVideoModule) return;
    
    // Update local state to show module completed and increase competency
    const completedName = activeVideoModule.module_name;
    setTrainingData((prev: any) => {
      if (!prev) return prev;
      const updatedCompleted = [
        {
          module_name: completedName,
          completed_at: new Date().toISOString(),
          score: 100,
        },
        ...(prev.completed_modules || [])
      ];
      const updatedRec = (prev.recommended_modules || []).filter(
        (m: any) => m.module_name !== completedName
      );
      const newSkill = Math.min(100, Number(((prev.current_skill_progress || 84.7) + 3.5).toFixed(1)));
      return {
        ...prev,
        current_skill_progress: newSkill,
        completed_modules: updatedCompleted,
        recommended_modules: updatedRec,
      };
    });

    setNotification(`COMPLETED: ${completedName} (+3.5% Skill Score)`);
    setTimeout(() => setNotification(null), 5000);
    setActiveVideoModule(null);
    setSelectedModule(null);
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#080A0B] text-[#929A9E] font-mono select-none overflow-hidden">
        <div className="w-12 h-12 rounded-full border-2 border-[#141819] border-t-[#FFCC00] animate-spin mb-6" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#F1F3F4]">LOADING TRAINING RECORDS</p>
      </div>
    );
  }

  const skillProgress = trainingData?.current_skill_progress || 0;
  const recentCompletion = trainingData?.completed_modules?.[0];
  const recModules = trainingData?.recommended_modules || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#080A0B] select-none relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#121618] border border-[#42C76A] text-[#42C76A] px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col px-8 py-4 lg:py-6 lg:px-12 max-w-[1600px] mx-auto w-full gap-4 lg:gap-6">
        
        {/* UPPER: HEADER & OVERALL PROGRESS */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 shrink-0">
          <div>
            <span className="font-mono text-xs font-bold tracking-widest text-[#929A9E] uppercase flex items-center gap-2">
              <BookOpen size={14} /> OPERATOR TRAINING
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#F1F3F4] tracking-tight mt-2 uppercase">
              SKILL PROGRESS
            </h1>
            <p className="font-mono text-sm tracking-widest text-[#FFCC00] mt-3 uppercase">
              {trainingData?.certifications_held?.length || 0} ACTIVE CERTIFICATIONS
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-6xl lg:text-7xl font-extrabold text-[#F1F3F4] tracking-tighter">
                  {skillProgress}
                </span>
                <span className="text-3xl text-[#929A9E] font-medium">%</span>
              </div>
              <span className="font-mono text-sm tracking-widest text-[#929A9E] uppercase">
                OVERALL COMPETENCY
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#141819] shrink-0" />

        {/* MIDDLE / LOWER: CONTENT REGION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 flex-1 min-h-0 items-start mt-2">
          
          {/* LEFT: RECOMMENDED & IN PROGRESS */}
          <div className="flex flex-col gap-4 h-full min-h-0 pr-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold">
                UPCOMING & RECOMMENDED
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#929A9E] uppercase">
                SELECT A MODULE TO VIEW
              </span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-280px)]">
              {recModules.length > 0 ? (
                recModules.map((mod: any, idx: number) => {
                  const isSelected = selectedModule?.module_name === mod.module_name;
                  const isSeatbelt = mod.module_name.toLowerCase().includes('seatbelt');

                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectModule(mod)}
                      className={`flex flex-col border transition-all cursor-pointer p-4 ${
                        isSelected 
                          ? 'border-[#FFCC00] bg-[#121618] shadow-[0_0_20px_rgba(255,204,0,0.12)]' 
                          : 'border-[#141819] hover:border-[#5E676C] bg-[#0D1011]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-sm font-bold text-[#F1F3F4] uppercase tracking-widest flex items-center gap-2">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse" />}
                          {mod.module_name}
                        </span>
                        <div className="flex items-center gap-2">
                          {isSeatbelt && (
                            <span className="font-mono text-[10px] bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/30 px-2 py-0.5 uppercase font-bold">
                              VIDEO AVAILABLE
                            </span>
                          )}
                          <span className="font-mono text-[10px] bg-[#141819] text-[#929A9E] px-2 py-1 uppercase font-bold">
                            {mod.priority_score > 80 ? 'HIGH PRIORITY' : 'RECOMMENDED'}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono text-xs text-[#929A9E] uppercase mb-3 line-clamp-2">
                        {mod.reason}
                      </span>

                      {/* Expanded Section with START button when clicked */}
                      {isSelected ? (
                        <div className="mt-2 pt-3 border-t border-[#1E2428] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                          <div className="flex items-center gap-3 text-[#929A9E] font-mono text-[11px] uppercase">
                            <span className="text-[#FFCC00] font-bold">● ACTIVE SELECTION</span>
                            <span>•</span>
                            <span>EST. 15 MIN</span>
                            {isSeatbelt && (
                              <>
                                <span>•</span>
                                <span className="text-[#42C76A] font-bold">IN-CAB VIDEO READY</span>
                              </>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartModule(mod);
                            }}
                            className="flex items-center justify-center gap-2 bg-[#FFCC00] hover:bg-[#FFE066] text-[#080A0B] px-5 py-2 font-mono text-xs font-black tracking-widest uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <Play size={12} fill="#080A0B" />
                            <span>START TRAINING</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-auto flex items-center justify-between text-[#5E676C]">
                          <span className="font-mono text-[10px] tracking-widest uppercase">Est. 15 MIN</span>
                          <div className="font-mono text-[10px] font-bold tracking-widest text-[#FFCC00] flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                            <Play size={10} />
                            <span>CLICK TO VIEW & START</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center p-8 border border-[#141819] border-dashed">
                  <span className="font-mono text-sm text-[#5E676C] tracking-widest uppercase font-bold">
                    ALL MODULES COMPLETE
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: RECENT HISTORY & CERTS */}
          <div className="flex flex-col gap-6 h-full min-h-0">
            <div className="flex flex-col flex-1 min-h-0 border border-[#141819] p-6 bg-[#0D1011]">
              <div className="flex items-center gap-2 mb-6">
                <Award size={16} className="text-[#42C76A]" />
                <span className="font-mono text-xs tracking-widest text-[#F1F3F4] uppercase font-bold">
                  RECENTLY COMPLETED
                </span>
              </div>
              
              {trainingData?.completed_modules && trainingData.completed_modules.length > 0 ? (
                <div className="flex flex-col gap-3 border-b border-[#141819] pb-4 mb-4 max-h-[180px] overflow-y-auto scrollbar-thin">
                  {trainingData.completed_modules.map((comp: any, cIdx: number) => (
                    <div key={cIdx} className="flex flex-col gap-1 border border-[#1A2024] p-3 bg-[#080A0B]">
                      <span className="font-mono text-sm font-bold text-[#42C76A] uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} /> {comp.module_name}
                      </span>
                      <div className="flex items-center justify-between font-mono text-[11px] text-[#929A9E] uppercase">
                        <span>Completed: {new Date(comp.completed_at).toLocaleDateString()}</span>
                        <span className="text-[#42C76A] font-bold">Score: {comp.score || 100}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="font-mono text-xs text-[#5E676C] uppercase tracking-widest mb-6">NO RECENT HISTORY</span>
              )}

              <span className="font-mono text-xs tracking-widest text-[#5E676C] uppercase font-bold mb-4 mt-2">
                ACTIVE CERTIFICATIONS
              </span>
              <div className="flex flex-col gap-3">
                {trainingData?.certifications_held?.map((cert: string, idx: number) => (
                  <div key={idx} className="flex justify-between items-center font-mono text-xs tracking-widest uppercase">
                    <span className="text-[#F1F3F4] font-bold">{cert}</span>
                    <span className="text-[#42C76A]">VALID</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Action */}
            <div className="mt-auto flex justify-end shrink-0">
              <button 
                onClick={() => navigate('/assist?question=' + encodeURIComponent('What specific skills should I focus on to improve my operator competency score?'), { state: { autoSubmit: true } })}
                className="group flex flex-col items-end gap-1 cursor-pointer outline-none"
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#FFCC00]">
                  <span>✦ ASK ASSIST</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">→</span>
                </div>
                <span className="font-mono text-sm tracking-widest text-[#929A9E] group-hover:text-[#F1F3F4] transition-colors uppercase">
                  How can I improve my skill level?
                </span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* IN-CAB VIDEO TRAINING PLAYER MODAL */}
      {activeVideoModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 lg:p-8 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#0D1011] border border-[#2B3338] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden max-h-[92vh]">
            
            {/* Player Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2428] bg-[#141819]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FFCC00] animate-pulse" />
                <div>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#FFCC00] uppercase block">
                    CATERPILLAR OPERATOR IQ • MANDATORY SAFETY MODULE
                  </span>
                  <h2 className="font-mono text-base sm:text-lg font-bold text-[#F1F3F4] uppercase tracking-wide">
                    {activeVideoModule.module_name}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setActiveVideoModule(null)}
                className="text-[#929A9E] hover:text-white p-2 rounded hover:bg-[#1E2428] transition-colors cursor-pointer"
                title="Close Player"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player Display */}
            <div className="relative bg-black flex items-center justify-center aspect-video w-full max-h-[55vh]">
              {activeVideoModule.module_name.toLowerCase().includes('seatbelt') ? (
                <video
                  ref={videoRef}
                  src="/videos/seatbelt_compliance.mp4"
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                  onEnded={() => setVideoCompleted(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
                  <BookOpen size={48} className="text-[#FFCC00] animate-bounce" />
                  <p className="font-mono text-sm text-[#F1F3F4] uppercase font-bold">
                    Interactive Training Session: {activeVideoModule.module_name}
                  </p>
                  <p className="font-mono text-xs text-[#929A9E] max-w-md uppercase">
                    Interactive module simulation active. Full video stream available for Seatbelt Compliance Essentials.
                  </p>
                </div>
              )}
            </div>

            {/* Player Footer / Controls & Actions */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#1E2428] bg-[#0A0D0E]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={videoCompleted ? 'text-[#42C76A]' : 'text-[#FFCC00]'} />
                  <span className={`font-mono text-xs font-bold tracking-widest uppercase ${videoCompleted ? 'text-[#42C76A]' : 'text-[#F1F3F4]'}`}>
                    {videoCompleted ? 'TRAINING COMPLETED • COMPLIANCE RECORDED' : 'ACTIVE SAFETY COMPLIANCE TRAINING'}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#929A9E] uppercase">
                  Always verify 3-point seatbelt engagement and retractor lock before machine travel.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {videoCompleted ? (
                  <button
                    onClick={handleCompleteTraining}
                    className="flex items-center gap-2 bg-[#42C76A] hover:bg-[#38ad5b] text-[#080A0B] px-5 py-2.5 font-mono text-xs font-black tracking-widest uppercase transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 size={16} />
                    <span>SAVE & FINISH</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteTraining}
                    className="flex items-center gap-2 bg-[#FFCC00] hover:bg-[#FFE066] text-[#080A0B] px-5 py-2 font-mono text-xs font-black tracking-widest uppercase transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    <span>MARK AS COMPLETE</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveVideoModule(null)}
                  className="px-4 py-2 border border-[#1E2428] hover:bg-[#1E2428] text-[#929A9E] hover:text-white font-mono text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

