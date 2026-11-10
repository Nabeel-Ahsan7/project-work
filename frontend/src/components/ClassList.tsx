import React from 'react';
import { SchoolClass } from '../api/types';
import { Users, Clock, CheckCircle, Ticket, AlertTriangle } from 'lucide-react';

interface Props {
  classes: SchoolClass[];
  loading: boolean;
  studentId: string;
  onApply: (schoolClass: SchoolClass) => void;
}

export const ClassList: React.FC<Props> = ({ classes, loading, studentId, onApply }) => {
  const isStudentIdValid = /^\d{17}$/.test(studentId.trim());

  if (loading && classes.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm">শ্রেণির তালিকা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <SchoolClassIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-800">কোনো শ্রেণি পাওয়া যায়নি</h3>
        <p className="text-sm text-gray-500 mt-1">অ্যাডমিন প্যানেল থেকে নতুন শ্রেণি যোগ করুন।</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {classes.map((cls) => {
        const isFull = cls.availableSeats <= 0;
        const confirmedPct = Math.round((cls.confirmedSeats / cls.totalSeats) * 100);
        const heldPct = Math.round((cls.heldSeats / cls.totalSeats) * 100);

        return (
          <div
            key={cls.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-base font-bold text-gray-900 leading-snug">{cls.name}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                    isFull
                      ? 'bg-rose-100 text-rose-700'
                      : cls.availableSeats <= 5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isFull ? 'আসন পূর্ণ' : `${cls.availableSeats} খালি`}
                </span>
              </div>

              {/* Multi-segment progress bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex mb-4">
                <div
                  style={{ width: `${confirmedPct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title={`নিশ্চিত: ${cls.confirmedSeats}`}
                />
                <div
                  style={{ width: `${heldPct}%` }}
                  className="bg-amber-400 h-full transition-all duration-300"
                  title={`হোল্ড: ${cls.heldSeats}`}
                />
              </div>

              {/* Seat metrics breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                <div className="bg-gray-50 p-2.5 rounded-lg flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-gray-500 block">মোট আসন:</span>
                    <span className="font-bold text-gray-800">{cls.totalSeats}</span>
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-gray-500 block">নিশ্চিত:</span>
                    <span className="font-bold text-emerald-700">{cls.confirmedSeats}</span>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-2.5 rounded-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-gray-500 block">হোল্ডে:</span>
                    <span className="font-bold text-amber-700">{cls.heldSeats}</span>
                  </div>
                </div>

                <div className="bg-blue-50/60 p-2.5 rounded-lg flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-gray-500 block">খালি আসন:</span>
                    <span className="font-bold text-blue-700">{cls.availableSeats}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => onApply(cls)}
                disabled={isFull}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
              >
                {isFull ? (
                  <>
                    <AlertTriangle className="w-4 h-4" /> আসন শেষ (Sold Out)
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" /> আবেদন করুন (Apply Now)
                  </>
                )}
              </button>
              {!isStudentIdValid && !isFull && (
                <p className="text-[11px] text-amber-600 mt-1.5 text-center">
                  * আবেদনের জন্য উপরে ১৭ ডিজিটের জন্ম নিবন্ধন দিন
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function SchoolClassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
