import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';

interface Props {
  studentId: string;
  onStudentIdChange: (id: string) => void;
}

export const StudentIdBar: React.FC<Props> = ({ studentId, onStudentIdChange }) => {
  const [inputVal, setInputVal] = useState(studentId);
  const isValid = /^\d{17}$/.test(inputVal.trim());

  useEffect(() => {
    setInputVal(studentId);
  }, [studentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 17);
    setInputVal(val);
    onStudentIdChange(val);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ভ
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">বিদ্যালয় ভর্তি পোর্টাল</h1>
            <p className="text-xs text-gray-500">School Admission System (আগে আবেদন করলে আগে পাবেন)</p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
          <label htmlFor="student-id-input" className="text-xs font-medium text-gray-600 flex items-center gap-1">
            শিক্ষার্থীর জন্ম নিবন্ধন নম্বর (১৭ সংখ্যা):
          </label>
          <div className="relative w-full sm:w-72">
            <input
              id="student-id-input"
              type="text"
              value={inputVal}
              onChange={handleChange}
              placeholder="e.g. 20152691234567890"
              maxLength={17}
              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono transition-colors ${
                inputVal.length === 0
                  ? 'border-gray-300 focus:ring-indigo-500'
                  : isValid
                  ? 'border-emerald-500 focus:ring-emerald-400 bg-emerald-50/30'
                  : 'border-amber-400 focus:ring-amber-400 bg-amber-50/30'
              }`}
            />
            <span className="absolute right-2.5 top-2 text-xs text-gray-400 font-mono">
              {inputVal.length}/17
            </span>
          </div>

          <div className="text-xs flex items-center gap-1">
            {isValid ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-medium">
                <UserCheck className="w-3.5 h-3.5" /> শিক্ষার্থী সক্রিয়
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" /> ১৭ ডিজিট প্রয়োজন
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
