'use client';
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, TrendingUp } from 'lucide-react';

interface CopilotProps {
  contextData: any;
}

export const CopilotWidget = ({ contextData }: CopilotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && contextData) {
      const timer = setTimeout(() => {
         handleAskCopilot('');
      }, 1500); // Un poco más de delay para no abrumar al inicio
      hasInitialized.current = true;
      return () => clearTimeout(timer);
    }
  }, [contextData]);

  const handleAskCopilot = async (query: string) => {
    if (!query && loading) return;
    
    if (query) {
        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setInput('');
    }
    setLoading(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        body: JSON.stringify({ context: contextData, message: query }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Sin conexión con el servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* VENTANA DEL CHAT (Flotante) */}
      {isOpen && (
        <div className="fixed bottom-36 right-8 w-80 md:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 z-[60]">
          
          {/* Header Elegante */}
          <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-tr from-emerald-400 to-cyan-400 p-2 rounded-xl">
                  <Bot size={20} className="text-slate-900"/>
               </div>
               <div>
                  <h3 className="font-bold text-sm text-white leading-tight">Fluxo Copilot</h3>
                  <p className="text-[10px] text-slate-400 font-medium">IA Financiera en tiempo real</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full hover:bg-white/20"><X size={16}/></button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-sm' 
                    : 'bg-white text-slate-600 border border-slate-100 rounded-bl-sm'
                }`}>
                  {/* Renderizado simple de Markdown para listas */}
                  {m.text.split('\n').map((line, idx) => (
                    <p key={idx} className={line.startsWith('-') ? 'pl-2 mb-1' : 'mb-1 last:mb-0'}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start">
                 <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
             <div className="relative flex items-center gap-2">
                <input 
                  type="text" 
                  className="w-full bg-slate-50 pl-4 pr-12 py-3.5 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-500/20 transition-all placeholder:text-slate-400 border border-slate-100"
                  placeholder="Ej: ¿Cómo aumento mi runway?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot(input)}
                />
                <button 
                  onClick={() => handleAskCopilot(input)}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2 bg-emerald-500 text-white rounded-xl disabled:opacity-50 hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                >
                   <Send size={16} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE (Posicionado ENCIMA del botón +) */}
      <div className="fixed bottom-28 right-10 z-40 flex flex-col items-center gap-2">
         {/* Badge de notificación */}
         {!isOpen && messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-slate-50 flex items-center justify-center z-50">
               <span className="text-[9px] font-black text-white">1</span>
            </span>
         )}
         
         <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-emerald-500 hover:scale-110 hover:text-emerald-600 transition-all active:scale-95 group relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {isOpen ? <X size={24}/> : <Sparkles size={24} className="fill-emerald-100"/>}
         </button>
      </div>
    </>
  );
};