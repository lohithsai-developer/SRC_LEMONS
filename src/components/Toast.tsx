import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let bg = 'bg-white border-slate-200 text-charcoal-900';
        let icon = <CheckCircle2 className="w-5 h-5 text-fresh-600 flex-shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-fresh-50 border-fresh-300 text-fresh-900';
          icon = <CheckCircle2 className="w-5 h-5 text-fresh-600 flex-shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-50 border-rose-300 text-rose-900';
          icon = <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-lemon-50 border-lemon-300 text-lemon-900';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg ${bg} transition-all duration-300 transform translate-y-0`}
          >
            <div className="flex items-center space-x-2.5">
              {icon}
              <p className="text-sm font-medium leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
