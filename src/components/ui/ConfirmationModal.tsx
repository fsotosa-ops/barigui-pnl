'use client';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-6 ${isDangerous ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
            <AlertTriangle size={32} strokeWidth={2} />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
            {description}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 ${
                isDangerous 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                  : 'bg-slate-900 hover:bg-black shadow-slate-200'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};