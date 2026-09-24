import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertCircle, 
  ArrowRight, 
  CornerDownLeft, 
  Delete, 
  RotateCcw,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, VALID_ACCESS_CODE } from '../context/AuthContext';
import OperatorIQLogo from '../components/hmi/OperatorIQLogo';

export default function AuthScreen() {
  const { isAuthenticated, login, error: contextError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [maskDigits, setMaskDigits] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated, redirect immediately to intended destination or /drive
  const from = (location.state as any)?.from?.pathname || '/drive';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Focus the first empty digit box or the first slot on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex(d => d === '');
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    inputRefs.current[targetIndex]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    clearError();
    setLocalError(null);

    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // If user pasted or typed multiple digits
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pastedDigits.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setDigits(newDigits);
      const nextIdx = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto advance to next input
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeAuth(digits.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    clearError();
    setLocalError(null);

    const targetIdx = Math.min(pastedData.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pastedData.length === 6) {
      executeAuth(pastedData);
    }
  };

  const executeAuth = useCallback((code: string) => {
    if (code.length < 6) {
      setLocalError('Please enter all 6 digits of your cab access code.');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    const success = login(code);

    if (success) {
      setIsSuccess(true);
      // Brief visual satisfaction pulse before navigating into cab
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 400);
    } else {
      setIsSubmitting(false);
      setLocalError('Invalid access code. Please check credentials and retry.');
      triggerShake();
      // Clear digits and refocus first slot for immediate retry
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [login, navigate, from]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleKeypadPress = (val: string) => {
    clearError();
    setLocalError(null);

    if (val === 'CLEAR') {
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    if (val === 'BACK') {
      // Find last filled index
      const lastFilledIndex = digits.map((d, i) => d !== '' ? i : -1).filter(i => i !== -1).pop();
      if (lastFilledIndex !== undefined) {
        const newDigits = [...digits];
        newDigits[lastFilledIndex] = '';
        setDigits(newDigits);
        inputRefs.current[lastFilledIndex]?.focus();
      }
      return;
    }

    // Number pressed
    const firstEmptyIndex = digits.findIndex(d => d === '');
    if (firstEmptyIndex !== -1) {
      const newDigits = [...digits];
      newDigits[firstEmptyIndex] = val;
      setDigits(newDigits);

      if (firstEmptyIndex < 5) {
        inputRefs.current[firstEmptyIndex + 1]?.focus();
      } else {
        // All 6 filled
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleQuickFill = () => {
    setDigits(VALID_ACCESS_CODE.split(''));
    clearError();
    setLocalError(null);
    inputRefs.current[5]?.focus();
  };

  const fullCode = digits.join('');
  const isCodeComplete = fullCode.length === 6;
  const displayError = localError || contextError;

  return (
    <div className="min-h-screen w-full bg-[#080A0B] text-[#F1F3F4] flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-[#FFCC00] selection:text-[#080A0B]">
      
      {/* Background Industrial Grid & Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 204, 0, 0.09) 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#FFCC00]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[300px] bg-[#42C76A]/3 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Industrial Header Bar */}
      <header className="w-full h-16 border-b border-[#1A1F22] bg-[#0C0F11]/90 backdrop-blur-md px-6 lg:px-12 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <OperatorIQLogo />
          <div className="h-5 w-px bg-[#262D31] hidden sm:block" />
          <div className="hidden sm:flex flex-col text-[11px] font-mono leading-tight tracking-wider text-[#929A9E]">
            <span className="text-[#F1F3F4] font-bold">EX-140GC HYDRAULIC EXCAVATOR</span>
            <span className="text-[#5E676C]">CAB CONSOLE UNIT #CAT-EX140-01</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#15191C] border border-[#262D31] text-[11px] font-mono text-[#929A9E]">
            <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse" />
            <span className="hidden md:inline text-[#929A9E]">TERMINAL STATUS:</span>
            <span className="text-[#FFCC00] font-bold tracking-wider">SECURE GATE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded bg-[#15191C] border border-[#262D31] text-[11px] font-mono text-[#5E676C]">
            <span>ISO 13849 / CAB INTERLOCK</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Terminal Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10">
        <div className="w-full max-w-xl bg-[#0D1012] border border-[#22282C] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden transition-all duration-300">
          
          {/* Bezel Top Indicator Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#FFCC00] to-transparent opacity-90" />

          <div className="p-6 sm:p-10 flex flex-col items-center text-center">
            
            {/* Security Icon Badge */}
            <div className="relative mb-5">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isSuccess 
                  ? 'bg-[#42C76A]/15 border-[#42C76A] text-[#42C76A] shadow-[0_0_24px_rgba(66,199,106,0.3)]'
                  : displayError
                  ? 'bg-[#E5484D]/15 border-[#E5484D] text-[#E5484D] shadow-[0_0_24px_rgba(229,72,77,0.3)]'
                  : 'bg-[#15191C] border-[#2A3135] text-[#FFCC00] shadow-[0_0_20px_rgba(255,204,0,0.15)]'
              }`}>
                {isSuccess ? (
                  <ShieldCheck className="w-8 h-8 animate-bounce" />
                ) : displayError ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <Lock className="w-8 h-8" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0D1012] border border-[#2A3135] text-[10px] text-[#929A9E]">
                <KeyRound className="w-3.5 h-3.5 text-[#FFCC00]" />
              </div>
            </div>

            {/* Header Titles */}
            <p className="font-mono text-xs tracking-widest text-[#FFCC00] uppercase font-bold mb-1.5">
              CATERPILLAR OPERATOR SYSTEM // CAB ACCESS GATE
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F1F3F4] tracking-tight uppercase mb-2">
              SECURE OPERATOR ACCESS
            </h1>
            <p className="text-xs sm:text-sm text-[#929A9E] max-w-md mb-6 leading-relaxed">
              Enter your authorized <span className="text-[#F1F3F4] font-semibold">6-digit access code</span> to unlock in-cab telemetry, hydraulic controls, and HMI diagnostics.
            </p>

            {/* Live Security / Status Indicator Badge */}
            <div className={`w-full max-w-md flex items-center justify-center gap-2.5 px-4 py-2 rounded border mb-7 font-mono text-xs tracking-wider transition-all duration-300 ${
              isSuccess 
                ? 'bg-[#42C76A]/10 border-[#42C76A]/40 text-[#42C76A]'
                : displayError
                ? 'bg-[#E5484D]/15 border-[#E5484D]/40 text-[#E5484D] animate-shake'
                : 'bg-[#14181B] border-[#22282C] text-[#929A9E]'
            }`}>
              {isSuccess ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#42C76A] animate-ping" />
                  <span className="font-bold">ACCESS GRANTED — INITIALIZING OPERATOR HMI...</span>
                </>
              ) : displayError ? (
                <>
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#E5484D]" />
                  <span className="font-bold">{displayError}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse" />
                  <span>CAB INTERLOCK ENGAGED — AWAITING 6-DIGIT CODE</span>
                </>
              )}
            </div>

            {/* 6-Digit Input Boxes Container */}
            <div 
              className={`flex items-center justify-center gap-2 sm:gap-3.5 mb-6 ${
                isShaking ? 'animate-shake' : ''
              }`}
              onPaste={handlePaste}
            >
              {digits.map((digit, index) => {
                const isFocused = document.activeElement === inputRefs.current[index];
                const isFilled = digit !== '';

                return (
                  <div key={index} className="relative group">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type={maskDigits ? 'password' : 'text'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isSuccess || isSubmitting}
                      aria-label={`Digit ${index + 1}`}
                      className={`w-11 h-14 sm:w-14 sm:h-18 text-center text-2xl sm:text-3xl font-mono font-black rounded border transition-all duration-200 outline-none select-none ${
                        displayError
                          ? 'border-[#E5484D] bg-[#E5484D]/10 text-[#E5484D] shadow-[0_0_12px_rgba(229,72,77,0.2)]'
                          : isSuccess
                          ? 'border-[#42C76A] bg-[#42C76A]/10 text-[#42C76A] shadow-[0_0_12px_rgba(66,199,106,0.25)]'
                          : isFilled
                          ? 'border-[#FFCC00] bg-[#171B1E] text-[#FFCC00] shadow-[0_0_10px_rgba(255,204,0,0.15)]'
                          : isFocused
                          ? 'border-[#FFCC00] bg-[#14181B] text-[#F1F3F4] ring-2 ring-[#FFCC00]/30'
                          : 'border-[#262D31] bg-[#111416] text-[#F1F3F4] hover:border-[#384146]'
                      }`}
                    />
                    {/* Active slot indicator pip */}
                    <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full transition-all duration-200 ${
                      isFilled 
                        ? 'bg-[#FFCC00]' 
                        : isFocused 
                        ? 'bg-[#FFCC00]/60' 
                        : 'bg-transparent'
                    }`} />
                  </div>
                );
              })}
            </div>

            {/* Masking toggle & slot info */}
            <div className="flex items-center justify-between w-full max-w-xs text-[11px] font-mono text-[#5E676C] mb-6">
              <span className="tracking-wider">
                {digits.filter(d => d !== '').length} OF 6 DIGITS
              </span>
              <button
                type="button"
                onClick={() => setMaskDigits(!maskDigits)}
                className="flex items-center gap-1.5 hover:text-[#929A9E] transition-colors cursor-pointer"
                title={maskDigits ? "Show numbers" : "Mask numbers"}
              >
                {maskDigits ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{maskDigits ? 'SHOW PIN' : 'HIDE PIN'}</span>
              </button>
            </div>

            {/* Main Action Buttons: Authenticate & Clear */}
            <div className="w-full max-w-sm flex flex-col gap-3 mb-6">
              <button
                type="button"
                onClick={() => executeAuth(fullCode)}
                disabled={!isCodeComplete || isSubmitting || isSuccess}
                className={`w-full py-3.5 px-6 rounded font-mono font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                  isCodeComplete && !isSubmitting && !isSuccess
                    ? 'bg-[#FFCC00] text-[#080A0B] hover:bg-[#FFD429] active:scale-[0.98] shadow-[0_0_24px_rgba(255,204,0,0.3)]'
                    : 'bg-[#181D20] text-[#5E676C] border border-[#262D31] cursor-not-allowed opacity-70'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#080A0B] border-t-transparent rounded-full animate-spin" />
                    <span>VERIFYING PIN...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>UNLOCKED</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="flex-1 py-2 px-3 rounded bg-[#131618] hover:bg-[#1A1F22] text-[#929A9E] hover:text-[#F1F3F4] border border-[#22282C] text-xs font-mono tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>CLEAR PIN</span>
                </button>

                <div className="text-[11px] font-mono text-[#5E676C] flex items-center gap-1">
                  <span>ENTER KEY TO SUBMIT</span>
                  <CornerDownLeft className="w-3 h-3 text-[#5E676C]" />
                </div>
              </div>
            </div>

            {/* Industrial On-Screen Touch Keypad (Cab Touchscreen Friendly) */}
            <div className="w-full max-w-xs pt-4 border-t border-[#1C2125]">
              <p className="text-[10px] font-mono tracking-widest text-[#5E676C] uppercase mb-3">
                CAB TOUCHSCREEN KEYPAD
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((key) => {
                  const isSpecial = key === 'CLEAR' || key === 'BACK';
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      disabled={isSuccess || isSubmitting}
                      className={`h-11 rounded font-mono font-bold text-sm tracking-wider flex items-center justify-center transition-all select-none cursor-pointer ${
                        isSpecial
                          ? 'bg-[#131618] hover:bg-[#1A1F23] active:bg-[#252B30] text-[#929A9E] border border-[#22282C] text-xs'
                          : 'bg-[#161B1E] hover:bg-[#20272B] active:bg-[#FFCC00] active:text-[#080A0B] text-[#F1F3F4] border border-[#262D32]'
                      }`}
                    >
                      {key === 'BACK' ? <Delete className="w-4 h-4 text-[#929A9E]" /> : key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hackathon Demo Helper Card */}
            <div className="w-full max-w-sm mt-6 p-3 rounded-md bg-[#13171A] border border-[#262D32] flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#FFCC00]" />
                <div className="font-mono text-xs">
                  <span className="text-[#929A9E] block text-[10px] uppercase tracking-wider">HACKATHON DEMO CODE</span>
                  <span className="text-[#FFCC00] font-black tracking-widest text-sm">PIN: {VALID_ACCESS_CODE}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickFill}
                className="px-2.5 py-1.5 rounded bg-[#FFCC00]/10 hover:bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/30 text-[10px] font-mono font-extrabold tracking-widest uppercase transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>QUICK FILL</span>
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="w-full h-12 border-t border-[#161A1D] bg-[#0A0D0E] px-6 lg:px-12 flex items-center justify-between text-[11px] font-mono text-[#5E676C] shrink-0 z-20">
        <div>
          <span>OPERATORIQ™ CAB GATEWAY OS v2.4</span>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <span>ENCRYPTED IN-CAB VOLATILE MEMORY</span>
          <span>REFRESH RE-AUTHENTICATION ENFORCED</span>
        </div>
        <div>
          <span>ISO 13849 COMPLIANT</span>
        </div>
      </footer>

    </div>
  );
}
