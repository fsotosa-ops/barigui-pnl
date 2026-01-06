'use client';
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, Maximize2, Minimize2, Trash2 } from 'lucide-react';

interface CopilotProps {
  contextData: any;
}

const formatMessage = (text: string) => {
  return text
    .split('\n')
    .map((line, i) => {
      const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.trim().startsWith('-')) {
        return <li key={i} className="ml-4 list-disc marker:text-emerald-500 pl-1 mb-1" dangerouslySetInnerHTML={{ __html: bolded.substring(1) }} />;
      }
      return <p key={i} className="mb-2 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: bolded }} />;
    });
};

export const CopilotWidget = ({ contextData }: CopilotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // 1. CARGAR HISTORIAL AL INICIO
  useEffect(() => {
    const saved = localStorage.getItem('fluxo_chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
      hasInitialized.current = true;
    } else if (!hasInitialized.current && contextData) {
      // Mensaje inicial si no hay historial
      setTimeout(() => {
         setMessages([{ role: 'bot', text: '¡Hola! Soy Fluxo. 🧠\nVeo tus números al día. ¿En qué te ayudo a ahorrar hoy?' }]);
      }, 1000);
      hasInitialized.current = true;
    }
  }, [contextData]);

  // 2. GUARDAR HISTORIAL AL CAMBIAR
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('fluxo_chat_history', JSON.stringify(messages));
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleAskCopilot = async (query: string) => {
    if (!query.trim() || loading) return;
    
    const userMsg = query;
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg } as const];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        body: JSON.stringify({ context: contextData, message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Tuve un problema de conexión. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if(confirm('¿Borrar historial de chat?')) {
        setMessages([{ role: 'bot', text: 'Historial borrado. ¿En qué te ayudo ahora?' }]);
        localStorage.removeItem('fluxo_chat_history');
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className={`fixed right-4 md:right-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 z-[60] font-sans ${
            isExpanded 
              ? 'bottom-8 top-8 w-[90vw] md:w-[600px]' 
              : 'bottom-32 w-[90vw] md:w-96 h-[550px]'
          }`}
        >
          <div className="bg-slate-950 p-4 px-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
               <div className="bg-emerald-500 p-2 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Bot size={24} className="text-white"/>
               </div>
               <div>
                  <h3 className="font-bold text-base text-white leading-tight">Fluxo AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">CFO Activo</p>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={clearHistory} className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all" title="Borrar historial"><Trash2 size={16} /></button>
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">{isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all"><X size={18}/></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {m.role === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3 shrink-0 mt-1">
                        <Bot size={16} className="text-emerald-700" />
                    </div>
                )}
                <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm shadow-sm relative ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
                }`}>
                  {formatMessage(m.text)}
                </div>
              </div>
            ))}
            
            {loading && (
               <div className="flex justify-start items-center">
                 <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <Bot size={16} className="text-emerald-700" />
                 </div>
                 <div className="bg-white px-4 py-3 rounded-[1.5rem] rounded-tl-sm shadow-sm border border-slate-200 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
             <div className="relative flex items-center gap-2">
                <input 
                  type="text" 
                  className="w-full bg-slate-50 pl-5 pr-14 py-4 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-400 border border-slate-200 hover:border-slate-300"
                  placeholder="Pregunta sobre tus finanzas..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot(input)}
                />
                <button 
                  onClick={() => handleAskCopilot(input)}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2.5 bg-slate-900 text-white rounded-xl disabled:opacity-50 disabled:scale-95 hover:bg-black hover:scale-105 transition-all shadow-md active:scale-95"
                >
                   <Send size={18} />
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-28 right-6 md:bottom-28 md:right-10 z-50 flex flex-col items-center gap-2">
         {!isOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-slate-50 flex items-center justify-center z-50 animate-bounce">
               <span className="text-[9px] font-black text-white">1</span>
            </span>
         )}
         
         <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 group relative overflow-hidden border-4 border-slate-50 ${
                isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-white text-emerald-500 hover:scale-110'
            }`}
         >
            {isOpen ? <X size={24}/> : <Sparkles size={24} className="fill-emerald-100"/>}
         </button>
      </div>
    </>
  );
};