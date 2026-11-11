import React from 'react';
import { UserPlus, Lock, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  onSelectStudentFlow: () => void;
  onSelectAdminFlow: () => void;
}

export const LandingPage: React.FC<Props> = ({ onSelectStudentFlow, onSelectAdminFlow }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              ভ
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-lg tracking-tight block">বিদ্যালয় ভর্তি পোর্টাল</span>
              <span className="text-[11px] text-gray-500 font-medium">School Admission System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSelectAdminFlow}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              প্রশাসক লগইন (Admin Login)
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold mb-6">
            <Clock className="w-3.5 h-3.5" /> নতুন শিক্ষাবর্ষে অনলাইন ভর্তি কার্যক্রম চালু রয়েছে
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            সহজ ও স্বচ্ছ অনলাইন <span className="text-indigo-600">বিদ্যালয় ভর্তি পদ্ধতি</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            "আগে আবেদন করলে আগে পাবেন" ভিত্তিতে প্রতিটি শ্রেণি ও শিফটে সীমিত আসনে দ্রুত ও রিয়েল-টাইমে আবেদন সম্পন্ন করুন। কোনো লটারি নেই।
          </p>

          {/* Action Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            {/* Student Card */}
            <div className="bg-white rounded-2xl p-7 border border-indigo-100 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">অভিভাবক ও শিক্ষার্থী</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিয়ে পছন্দসই শ্রেণি ও শিফটে আসন সাময়িকভাবে সংরক্ষণ করুন এবং ভর্তি ফি জমা দিয়ে ভর্তি নিশ্চিত করুন।
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <button
                  onClick={onSelectStudentFlow}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  ভর্তির জন্য আবেদন করুন (Apply for Admission)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Admin Card */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">বিদ্যালয় প্রশাসক (Admin)</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  শ্রেণি ও শিফট ব্যবস্থাপনা, মোট আসন বরাদ্দ, সেশন তৈরি ও লাইভ আসন পরিসংখ্যান তদারকি করুন। ডেমো পাসওয়ার্ড UI-তেই সংরক্ষিত রয়েছে।
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <button
                  onClick={onSelectAdminFlow}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  প্রশাসক প্যানেল লগইন (Admin Login)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-xs text-gray-600">
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white/70 border border-gray-200/60 shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>রিয়েল-টাইম আসন ট্র্যাকিং</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white/70 border border-gray-200/60 shadow-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>১০ মিনিটের অটো-হোল্ড মেয়াদ</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white/70 border border-gray-200/60 shadow-sm">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>উচ্চ ট্রাফিকে কনকারেন্সি নিরাপদ</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} School Admission Portal. All rights reserved.
      </footer>
    </div>
  );
};
