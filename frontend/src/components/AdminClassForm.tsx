import React, { useState } from 'react';
import { PlusCircle, School, Hash } from 'lucide-react';
import { api } from '../api/client';

interface Props {
  onClassCreated: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const AdminClassForm: React.FC<Props> = ({ onClassCreated, onError, onSuccess }) => {
  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onError('শ্রেণির নাম লিখুন (Class name is required)');
      return;
    }
    if (!totalSeats || Number(totalSeats) <= 0) {
      onError('মোট আসন সংখ্যা ১ বা তার বেশি হতে হবে (Seats must be at least 1)');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createClass({
        name: name.trim(),
        totalSeats: Number(totalSeats)
      });
      onSuccess(`নতুন শ্রেণি "${res.name}" তৈরি হয়েছে (${res.totalSeats} আসন)`);
      setName('');
      setTotalSeats('');
      setIsOpen(false);
      onClassCreated();
    } catch (err: any) {
      onError(err.message || 'শ্রেণি তৈরি করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">অ্যাডমিন প্যানেল: শ্রেণি তৈরি (Admin: Create Class)</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {isOpen ? 'লুকান (Hide)' : '+ নতুন শ্রেণি যোগ করুন (Add Class)'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              শ্রেণির নাম ও শিফট (e.g. Class 6 – Morning Shift)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 6 – Morning Shift"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              মোট আসন সংখ্যা (Total Seats)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <Hash className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              {loading ? 'তৈরি হচ্ছে...' : 'শ্রেণি প্রকাশ করুন (Create)'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
