import React, { useState } from 'react';
import { Lock, KeyRound, User, ArrowLeft, Zap } from 'lucide-react';
import { api } from '../api/client';

interface Props {
  onLoginSuccess: (token: string, username: string) => void;
  onBack: () => void;
  onError: (msg: string) => void;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBack, onError }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      onError('ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    try {
      setLoading(true);
      const res = await api.adminLogin(username.trim(), password);
      onLoginSuccess(res.token, res.username);
    } catch (err: any) {
      onError(err.message || 'লগইন ব্যর্থ হয়েছে। ইউজারনেম বা পাসওয়ার্ড ভুল।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setUsername('admin');
    setPassword('admin123');
    try {
      setLoading(true);
      const res = await api.adminLogin('admin', 'admin123');
      onLoginSuccess(res.token, res.username);
    } catch (err: any) {
      onError(err.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> প্রথম পাতায় ফিরে যান (Back to Home)
        </button>

        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-3">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-center text-2xl font-black text-gray-900 tracking-tight">
          বিদ্যালয় প্রশাসক লগইন
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          Admin Portal Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Seeded Credentials Quick Access Box */}
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> সংরক্ষিত ডেমো ক্রেডেনশিয়াল (Seeded Demo)
            </span>
            <span className="text-[11px] bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-md font-mono">
              Auto-Seeded
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-1 mb-3 font-mono bg-white/70 p-2.5 rounded-lg border border-indigo-100">
            <div><span className="text-gray-400">Username:</span> <strong>admin</strong></div>
            <div><span className="text-gray-400">Password:</span> <strong>admin123</strong></div>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            {loading ? 'লগইন হচ্ছে...' : '১-ক্লিকে ডেমো লগইন করুন (1-Click Login)'}
          </button>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-gray-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ইউজারনেম (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md transition-colors"
            >
              {loading ? 'লগইন যাচাই হচ্ছে...' : 'লগইন করুন (Sign In)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
