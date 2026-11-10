import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface AlertMessage {
  type: 'error' | 'success' | 'info';
  text: string;
}

interface Props {
  alert: AlertMessage | null;
  onClose: () => void;
}

export const Notification: React.FC<Props> = ({ alert, onClose }) => {
  if (!alert) return null;

  const isError = alert.type === 'error';
  const isSuccess = alert.type === 'success';

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-lg border flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom duration-200 ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-indigo-50 border-indigo-200 text-indigo-900'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 text-sm font-medium leading-relaxed">{alert.text}</div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
