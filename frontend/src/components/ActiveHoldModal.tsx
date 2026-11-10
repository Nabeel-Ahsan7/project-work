import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { HoldResponse } from '../api/types';

interface Props {
  hold: HoldResponse & { className?: string };
  studentId: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onHoldUpdated: () => void;
  onClose: () => void;
}

export const ActiveHoldModal: React.FC<Props> = ({
  hold,
  studentId,
  onSuccess,
  onError,
  onHoldUpdated,
  onClose
}) => {
  const [currentStatus, setCurrentStatus] = useState(hold.status);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    const expiresMs = new Date(hold.expiresAt).getTime();
    return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
  });
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setCurrentStatus(hold.status);
    const expiresMs = new Date(hold.expiresAt).getTime();
    const initialSeconds = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
    setTimeLeftSeconds(initialSeconds);

    if (initialSeconds <= 0 && hold.status === 'HELD') {
      setCurrentStatus('EXPIRED');
    }
  }, [hold]);

  useEffect(() => {
    if (currentStatus !== 'HELD') return;

    const timer = setInterval(() => {
      const expiresMs = new Date(hold.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setTimeLeftSeconds(diff);

      if (diff <= 0) {
        setCurrentStatus('EXPIRED');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hold.expiresAt, currentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmPayment = async () => {
    if (currentStatus !== 'HELD' || timeLeftSeconds <= 0) {
      onError('আবেদনের মেয়াদ শেষ হয়ে গেছে। আর ফি জমা দেওয়া যাবে না।');
      return;
    }

    try {
      setConfirming(true);
      await api.confirmHold(hold.holdId, studentId);
      setCurrentStatus('CONFIRMED');
      onSuccess('ভর্তি ফি সফলভাবে জমা হয়েছে! আপনার ভর্তি নিশ্চিত করা হয়েছে।');
      onHoldUpdated();
    } catch (err: any) {
      onError(err.message || 'ভর্তি ফি জমা দিতে ব্যর্থ হয়েছে');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelHold = async () => {
    try {
      setCancelling(true);
      await api.cancelHold(hold.holdId, studentId);
      setCurrentStatus('CANCELLED');
      onSuccess('আবেদন বাতিল করা হয়েছে। আসনটি উন্মুক্ত হয়েছে।');
      onHoldUpdated();
      onClose();
    } catch (err: any) {
      onError(err.message || 'আবেদন বাতিল করতে ব্যর্থ হয়েছে');
    } finally {
      setCancelling(false);
    }
  };

  const isExpired = currentStatus === 'EXPIRED' || (currentStatus === 'HELD' && timeLeftSeconds <= 0);
  const isConfirmed = currentStatus === 'CONFIRMED';
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">আবেদন ও ভর্তি বিবরণী</h3>
            <p className="text-xs text-gray-500 font-mono">আইডি: {hold.holdId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="py-5 space-y-4">
          {hold.className && (
            <div className="bg-indigo-50/60 p-3 rounded-xl">
              <span className="text-xs text-indigo-700 block font-medium">আবেদনকৃত শ্রেণি:</span>
              <span className="text-base font-bold text-indigo-950">{hold.className}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-xs font-medium text-gray-600">বর্তমান অবস্থা:</span>
            {isConfirmed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> ভর্তি নিশ্চিত (CONFIRMED)
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                <AlertCircle className="w-3.5 h-3.5" /> মেয়াদ উত্তীর্ণ (EXPIRED)
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                <XCircle className="w-3.5 h-3.5" /> বাতিল (CANCELLED)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                <Clock className="w-3.5 h-3.5" /> সাময়িক সংরক্ষিত (HELD)
              </span>
            )}
          </div>

          {/* Live Expiration Countdown */}
          {!isConfirmed && !isCancelled && (
            <div
              className={`p-4 rounded-xl border text-center transition-colors ${
                isExpired
                  ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                  : 'bg-amber-50/50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold mb-1">
                <Clock className="w-4 h-4" />
                {isExpired ? 'সময় শেষ হয়েছে' : 'মেয়াদ শেষ হতে বাকি সময়:'}
              </div>
              <div className="text-3xl font-extrabold font-mono tracking-wider">
                {isExpired ? '00:00' : formatTime(timeLeftSeconds)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {isExpired
                  ? 'মেয়াদ শেষ হওয়ায় আসনটি অন্যদের জন্য উন্মুক্ত করা হয়েছে।'
                  : 'এই সময়ের মধ্যে ভর্তি ফি জমা দিয়ে ভর্তি নিশ্চিত করুন।'}
              </p>
            </div>
          )}

          {isConfirmed && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
              <div className="text-sm font-bold">ভর্তি নিশ্চিত সম্পন্ন!</div>
              <p className="text-xs text-emerald-700 mt-1">
                শিক্ষার্থী আইডি: <span className="font-mono font-semibold">{studentId}</span>
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
          {!isConfirmed && !isCancelled && (
            <>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isExpired || confirming}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {confirming ? 'যাচাই হচ্ছে...' : 'ভর্তি ফি দিন (Confirm)'}
              </button>

              <button
                type="button"
                onClick={handleCancelHold}
                disabled={cancelling}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
              >
                {cancelling ? 'বাতিল হচ্ছে...' : 'বাতিল (Cancel)'}
              </button>
            </>
          )}

          {(isConfirmed || isCancelled) && (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              বন্ধ করুন (Close)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
