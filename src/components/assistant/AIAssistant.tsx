import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import { api } from '../../api/client';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [operatorId, setOperatorId] = useState<string>('');
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

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Fetch operator context (assuming the first active operator for this demo)
    async function init() {
      try {
        const ops = await api.getOperators();
        if (ops && ops.length > 0) {
          setOperatorId(ops[0].operator_id);
          // Initial greeting
          setMessages([{
            role: 'assistant',
            content: `Hello ${ops[0].name || ops[0].operator_id}, I'm your OperatorIQ Assistant. How can I help you today?`
          }]);
        }
      } catch (err) {
        console.error("Failed to init assistant", err);
      }
    }
    init();
  }, []);

  const handleSend = async (overrideMessage?: string) => {
    const text = overrideMessage || input;
    if (!text.trim() || !operatorId) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.chatWithAssistant(text, operatorId);
      
      const reply = response.response || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Simple Text-to-Speech (only if not muted)
      if (!isMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      // Depending on implementation, Web Speech API stops here
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto send if we got a full transcript
      setTimeout(() => handleSend(transcript), 500);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const quickActions = [
    "What is my current task?",
    "When will I finish this task?",
    "Am I safe right now?",
    "Why is my fuel burn high?",
    "Summarize my shift"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-500 text-surface-950 flex items-center justify-center shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform z-50 animate-bounce-slow"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-surface-900 border border-surface-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-700 bg-surface-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
            <MessageSquare size={16} className="text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-50 text-sm">OperatorIQ Assistant</h3>
            <p className="text-xs text-surface-400">Powered by xAI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-surface-400 hover:text-surface-100 p-1">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-br-none' 
                : 'bg-surface-800 text-surface-100 border border-surface-700 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-800 border border-surface-700 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-surface-700 bg-surface-800 hover:bg-surface-700 hover:border-surface-600 text-surface-300 transition-colors whitespace-nowrap"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-surface-700 bg-surface-800/30">
        <div className="flex items-center gap-2 bg-surface-950 border border-surface-700 rounded-lg p-1 pr-2 focus-within:border-brand-500/50 transition-colors">
          <button 
            onClick={toggleListen}
            className={`p-2 rounded-md transition-colors ${
              isListening ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-surface-400 hover:text-brand-400 hover:bg-surface-800'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button 
            onClick={toggleMute}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
            className={`p-2 rounded-md transition-colors ${
              isMuted ? 'text-red-400 bg-red-400/10' : 'text-surface-400 hover:text-brand-400 hover:bg-surface-800'
            }`}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about tasks, safety, fuel..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-surface-50 placeholder-surface-500 py-2"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-md bg-brand-500 text-surface-950 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
