import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function NotificationToast({ toast, onClose }) {
  if (!toast) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-slate-900/95 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
      <div className="shrink-0 mt-0.5">
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
        {isWarning && <AlertCircle className="w-5 h-5 text-amber-400" />}
        {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-brand-400" />}
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && <div className="text-xs font-bold text-white mb-0.5">{toast.title}</div>}
        <div className="text-xs text-slate-300 leading-relaxed">{toast.message}</div>
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
