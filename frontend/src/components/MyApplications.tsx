import React from 'react';
import { MeHold } from '../api/types';
import { FileText, CheckCircle2, Clock, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  holds: MeHold[];
  loading: boolean;
  studentId: string;
  onSelectHold: (hold: MeHold) => void;
  onRefresh: () => void;
}

export const MyApplications: React.FC<Props> = ({
  holds,
  loading,
  studentId,
  onSelectHold,
  onRefresh
}) => {
  const isStudentIdValid = /^\d{17}$/.test(studentId.trim());

  if (!isStudentIdValid) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-gray-800">শিক্ষার্থী পরিচয় আবশ্যক</h3>
        <p className="text-sm text-gray-500 mt-1">
          আপনার আবেদন তালিকা দেখতে উপরে ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর লিখুন।
        </p>
      </div>
    );
  }

  if (loading && holds.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        <p className="text-sm">আবেদনের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (holds.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-800">কোনো আবেদন পাওয়া যায়নি</h3>
        <p className="text-sm text-gray-500 mt-1">
          এই জন্ম নিবন্ধন নম্বরে এখনও কোনো আবেদন করা হয়নি।
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">আমার সকল আবেদন ({holds.length}টি)</h3>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          হালনাগাদ করুন (Refresh)
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {holds.map((h) => {
          const isHeld = h.status === 'HELD';
          const isConfirmed = h.status === 'CONFIRMED';
          const isExpired = h.status === 'EXPIRED';

          return (
            <div key={h.holdId} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">{h.className}</h4>
                  <span className="text-xs font-mono text-gray-400">#{h.holdId}</span>
                </div>
                <div className="text-xs text-gray-500">
                  মেয়াদ: {new Date(h.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(h.expiresAt).toLocaleDateString()})
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {isConfirmed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ভর্তি নিশ্চিত
                  </span>
                ) : isHeld ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                    <Clock className="w-3.5 h-3.5" /> হোল্ডে আছে
                  </span>
                ) : isExpired ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" /> মেয়াদ উত্তীর্ণ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <XCircle className="w-3.5 h-3.5" /> বাতিল
                  </span>
                )}

                <button
                  onClick={() => onSelectHold(h)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                >
                  বিবরণী <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
