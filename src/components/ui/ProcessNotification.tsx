'use client';
import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'error';

interface NotificationProps {
  isOpen: boolean;
  onClose: () => void;
  type: NotificationType;
  title: string;
  details: string[];
}

export const ProcessNotification = ({ isOpen, onClose, type, title, details }: NotificationProps) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 8000); // Auto-cierre en 8 seg
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: { bg: 'bg-slate-900', border: 'border-emerald-500/30', icon: <CheckCircle2 className="text-emerald-400" size={24} /> },
    warning: { bg: 'bg-slate-900', border: 'border-amber-500/30', icon: <AlertTriangle className="text-amber-400" size={24} /> },
    error: { bg: 'bg-slate-900', border: 'border-rose-500/30', icon: <XCircle className="text-rose-400" size={24} /> }
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`${currentStyle.bg} text-white p-5 rounded-2xl shadow-2xl border ${currentStyle.border} min-w-[320px] max-w-md flex gap-4`}>
        <div className="shrink-0 mt-1">{currentStyle.icon}</div>
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <div className="space-y-1">
            {details.map((line, i) => (
              <p key={i} className="text-xs text-slate-300 font-medium leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors h-fit">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};