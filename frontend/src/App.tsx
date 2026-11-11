import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentIdBar } from './components/StudentIdBar';
import { ClassList } from './components/ClassList';
import { ActiveHoldModal } from './components/ActiveHoldModal';
import { MyApplications } from './components/MyApplications';
import { Notification, AlertMessage } from './components/Notification';
import { api } from './api/client';
import { SchoolClass, HoldResponse, MeHold } from './api/types';
import { BookOpen, FileCheck, RefreshCw, AlertCircle, Home, Lock } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation View: 'landing' | 'student' | 'admin-login' | 'admin-dashboard'
  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'admin-login' | 'admin-dashboard'>(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    return savedToken ? 'admin-dashboard' : 'landing';
  });

  const [adminUsername, setAdminUsername] = useState<string>(() => {
    return sessionStorage.getItem('admin_username') || 'admin';
  });

  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('student_id') || '';
  });

  const [activeTab, setActiveTab] = useState<'classes' | 'my-applications'>('classes');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [myHolds, setMyHolds] = useState<MeHold[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingHolds, setLoadingHolds] = useState(false);
  
  const [activeHold, setActiveHold] = useState<(HoldResponse & { className?: string }) | null>(() => {
    const saved = localStorage.getItem('active_hold');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((type: 'error' | 'success' | 'info', text: string) => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlert({ type, text });
    alertTimerRef.current = setTimeout(() => {
      setAlert(null);
    }, 6000);
  }, []);

  const handleStudentIdChange = (id: string) => {
    setStudentId(id);
    localStorage.setItem('student_id', id);
  };

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err: any) {
      if (classes.length === 0 && currentView === 'student') {
        showAlert('error', err.message || 'শ্রেণির তালিকা আনা যাচ্ছে না');
      }
    } finally {
      setLoadingClasses(false);
    }
  }, [classes.length, currentView, showAlert]);

  // Fetch student's applications
  const fetchMyHolds = useCallback(async () => {
    if (!/^\d{17}$/.test(studentId.trim())) {
      setMyHolds([]);
      return;
    }
    try {
      setLoadingHolds(true);
      const data = await api.getMyHolds(studentId.trim());
      setMyHolds(data);
    } catch (err: any) {
      showAlert('error', err.message || 'আপনার আবেদন তালিকা আনা যাচ্ছে না');
    } finally {
      setLoadingHolds(false);
    }
  }, [studentId, showAlert]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (/^\d{17}$/.test(studentId.trim())) {
      fetchMyHolds();
    }
  }, [studentId, fetchMyHolds]);

  // Seat polling every 3 seconds without page reload
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClasses();
      if (activeTab === 'my-applications' && /^\d{17}$/.test(studentId.trim())) {
        fetchMyHolds();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchClasses, fetchMyHolds, activeTab, studentId]);

  // Sync activeHold to localStorage
  useEffect(() => {
    if (activeHold) {
      localStorage.setItem('active_hold', JSON.stringify(activeHold));
    } else {
      localStorage.removeItem('active_hold');
    }
  }, [activeHold]);

  const handleApply = async (schoolClass: SchoolClass) => {
    if (!/^\d{17}$/.test(studentId.trim())) {
      showAlert('error', 'আবেদনের পূর্বে দয়া করে উপরে আপনার ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন।');
      return;
    }

    try {
      showAlert('info', `"${schoolClass.name}"-এ আসন সংরক্ষণের অনুরোধ পাঠানো হচ্ছে...`);
      const hold = await api.createHold(schoolClass.id, studentId.trim());
      const holdWithClass = { ...hold, className: schoolClass.name };
      setActiveHold(holdWithClass);
      showAlert('success', 'আসন সাময়িকভাবে সংরক্ষিত হয়েছে! নির্দিষ্ট সময়ের মধ্যে ভর্তি ফি প্রদান করুন।');
      fetchClasses();
      fetchMyHolds();
    } catch (err: any) {
      showAlert('error', err.message || 'আসন সংরক্ষণ করা যায়নি।');
      fetchClasses();
    }
  };

  const handleHoldUpdated = () => {
    fetchClasses();
    fetchMyHolds();
  };

  const handleAdminLoginSuccess = (token: string, username: string) => {
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_username', username);
    setAdminUsername(username);
    setCurrentView('admin-dashboard');
    showAlert('success', `স্বাগতম ${username}! আপনি সফলভাবে অ্যাডমিন প্যানেলে লগইন করেছেন।`);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_username');
    setCurrentView('landing');
    showAlert('info', 'অ্যাডমিন অ্যাকাউন্ট থেকে লগআউট সম্পন্ন হয়েছে।');
  };

  // View 1: Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onSelectStudentFlow={() => setCurrentView('student')}
          onSelectAdminFlow={() => setCurrentView('admin-login')}
        />
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

  // View 2: Admin Login
  if (currentView === 'admin-login') {
    return (
      <>
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBack={() => setCurrentView('landing')}
          onError={(msg) => showAlert('error', msg)}
        />
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

  // View 3: Admin Dashboard
  if (currentView === 'admin-dashboard') {
    return (
      <>
        <AdminDashboard
          adminUsername={adminUsername}
          onLogout={handleAdminLogout}
          onGoToHome={() => setCurrentView('student')}
          onSuccess={(msg) => showAlert('success', msg)}
          onError={(msg) => showAlert('error', msg)}
        />
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

  // View 4: Student Admission View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Student Identity Bar */}
      <StudentIdBar studentId={studentId} onStudentIdChange={handleStudentIdChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs with Home and Admin Quick Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('landing')}
              className="inline-flex items-center gap-1.5 py-3 px-3 text-xs font-semibold text-gray-500 hover:text-gray-900 border-b-2 border-transparent transition-colors"
            >
              <Home className="w-4 h-4" /> প্রথম পাতা
            </button>

            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-colors ${
                activeTab === 'classes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              শ্রেণি ও আসন তালিকা
            </button>

            <button
              onClick={() => setActiveTab('my-applications')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-sm transition-colors relative ${
                activeTab === 'my-applications'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              আমার আবেদন
              {myHolds.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {myHolds.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              onClick={() => setCurrentView('admin-login')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" /> অ্যাডমিন লগইন
            </button>

            {activeHold && activeHold.status === 'HELD' && (
              <button
                onClick={() => setActiveHold({ ...activeHold })}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors animate-pulse"
              >
                <AlertCircle className="w-4 h-4 text-amber-700" />
                চলমান আবেদন দেখুন
              </button>
            )}

            <button
              onClick={() => {
                fetchClasses();
                if (/^\d{17}$/.test(studentId.trim())) fetchMyHolds();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
              title="তথ্য রিফ্রেশ করুন"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Classes & Application */}
        {activeTab === 'classes' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">ভর্তিযোগ্য শ্রেণিসমূহ (Available Classes & Shifts)</h2>
                <p className="text-xs text-gray-500">আসন সংখ্যা প্রতি ৩ সেকেন্ড পরপর স্বয়ংক্রিয়ভাবে আপডেট হয়।</p>
              </div>
            </div>

            <ClassList
              classes={classes}
              loading={loadingClasses}
              studentId={studentId}
              onApply={handleApply}
            />
          </div>
        )}

        {/* Tab 2: My Applications */}
        {activeTab === 'my-applications' && (
          <div>
            <MyApplications
              holds={myHolds}
              loading={loadingHolds}
              studentId={studentId}
              onRefresh={fetchMyHolds}
              onSelectHold={(h) => {
                setActiveHold({
                  holdId: h.holdId,
                  classId: h.classId,
                  className: h.className,
                  status: h.status,
                  expiresAt: h.expiresAt
                });
              }}
            />
          </div>
        )}
      </main>

      {/* Active Hold Modal with Countdown & Confirmation */}
      {activeHold && (
        <ActiveHoldModal
          hold={activeHold}
          studentId={studentId}
          onSuccess={(msg) => showAlert('success', msg)}
          onError={(msg) => showAlert('error', msg)}
          onHoldUpdated={handleHoldUpdated}
          onClose={() => setActiveHold(null)}
        />
      )}

      {/* Notifications */}
      <Notification alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
};

export default App;
