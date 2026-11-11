import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentRegister } from './components/StudentRegister';
import { StudentProfileCard } from './components/StudentProfileCard';
import { StudentIdBar } from './components/StudentIdBar';
import { ClassList } from './components/ClassList';
import { ActiveHoldModal } from './components/ActiveHoldModal';
import { MyApplications } from './components/MyApplications';
import { Notification, AlertMessage } from './components/Notification';
import { api } from './api/client';
import { SchoolClass, HoldResponse, MeHold, StudentProfile } from './api/types';
import { BookOpen, FileCheck, RefreshCw, AlertCircle, Home, Lock } from 'lucide-react';

type View = 'landing' | 'student-entry' | 'register' | 'student' | 'admin-login' | 'admin-dashboard';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) return 'admin-dashboard';
    const savedProfile = sessionStorage.getItem('student_profile');
    if (savedProfile) return 'student';
    return 'landing';
  });

  const [adminUsername, setAdminUsername] = useState<string>(() => {
    return sessionStorage.getItem('admin_username') || 'admin';
  });

  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('student_id') || '';
  });

  // Student profile from registration / lookup
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    const saved = sessionStorage.getItem('student_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  // Birth cert number typed on the entry screen (before profile lookup)
  const [entryBirthCert, setEntryBirthCert] = useState('');
  const [entryLoading, setEntryLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'classes' | 'my-applications'>('classes');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [myHolds, setMyHolds] = useState<MeHold[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingHolds, setLoadingHolds] = useState(false);

  const [activeHold, setActiveHold] = useState<(HoldResponse & { className?: string }) | null>(() => {
    const saved = localStorage.getItem('active_hold');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((type: 'error' | 'success' | 'info', text: string) => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlert({ type, text });
    alertTimerRef.current = setTimeout(() => setAlert(null), 6000);
  }, []);

  // Persist student profile in sessionStorage
  useEffect(() => {
    if (studentProfile) {
      sessionStorage.setItem('student_profile', JSON.stringify(studentProfile));
    } else {
      sessionStorage.removeItem('student_profile');
    }
  }, [studentProfile]);

  // Sync activeHold to localStorage
  useEffect(() => {
    if (activeHold) {
      localStorage.setItem('active_hold', JSON.stringify(activeHold));
    } else {
      localStorage.removeItem('active_hold');
    }
  }, [activeHold]);

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

  const fetchMyHolds = useCallback(async () => {
    if (!studentId || !/^\d{17}$/.test(studentId.trim())) {
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

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  useEffect(() => {
    if (/^\d{17}$/.test(studentId.trim())) fetchMyHolds();
  }, [studentId, fetchMyHolds]);

  // Seat polling every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClasses();
      if (activeTab === 'my-applications' && /^\d{17}$/.test(studentId.trim())) {
        fetchMyHolds();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchClasses, fetchMyHolds, activeTab, studentId]);

  // ── Student entry flow ───────────────────────────────────────────────────

  const handleStudentFlowStart = () => {
    // If already has a profile in session, go straight to admission
    if (studentProfile) {
      setCurrentView('student');
      return;
    }
    setEntryBirthCert(studentId || '');
    setCurrentView('student-entry');
  };

  const handleEntrySubmit = async () => {
    const cert = entryBirthCert.trim();
    if (!/^\d{17}$/.test(cert)) {
      showAlert('error', 'অনুগ্রহ করে সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন।');
      return;
    }
    setEntryLoading(true);
    try {
      const profile = await api.getStudentProfile(cert);
      // Profile exists — set it and show confirmation
      setStudentProfile(profile);
      setStudentId(profile.birthCertificateNo);
      localStorage.setItem('student_id', profile.birthCertificateNo);
      // Go to profile-confirm view (re-use 'student-entry' but with profile set)
    } catch (err: any) {
      if (err.message?.includes('No profile found') || err.message?.includes('404')) {
        // Not registered yet — go to register form
        setCurrentView('register');
      } else {
        showAlert('error', err.message || 'প্রোফাইল খোঁজা যাচ্ছে না। পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setEntryLoading(false);
    }
  };

  const handleProfileRegistered = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setStudentId(profile.birthCertificateNo);
    localStorage.setItem('student_id', profile.birthCertificateNo);
    showAlert('success', `স্বাগতম ${profile.fullName}! নিবন্ধন সম্পন্ন। এখন ভর্তির আবেদন করুন।`);
    setCurrentView('student-entry'); // go to profile confirm screen
  };

  const handleProfileConfirmed = () => {
    setCurrentView('student');
  };

  const handleStudentLogout = () => {
    setStudentProfile(null);
    setStudentId('');
    localStorage.removeItem('student_id');
    localStorage.removeItem('active_hold');
    setActiveHold(null);
    setCurrentView('landing');
  };

  // ── Admission actions ────────────────────────────────────────────────────

  const handleApply = async (schoolClass: SchoolClass) => {
    if (!studentProfile) {
      showAlert('error', 'আবেদনের আগে দয়া করে প্রোফাইল তৈরি করুন।');
      setCurrentView('student-entry');
      return;
    }
    if (!/^\d{17}$/.test(studentId.trim())) {
      showAlert('error', 'জন্ম নিবন্ধন নম্বর পাওয়া যাচ্ছে না।');
      return;
    }
    try {
      showAlert('info', `"${schoolClass.name}"-এ আসন সংরক্ষণের অনুরোধ পাঠানো হচ্ছে...`);
      const hold = await api.createHold(schoolClass.id, studentId.trim());
      const holdWithClass = { ...hold, className: schoolClass.name };
      setActiveHold(holdWithClass);
      showAlert('success', 'আসন সাময়িকভাবে সংরক্ষিত হয়েছে! নির্দিষ্ট সময়ের মধ্যে ভর্তি ফি প্রদান করুন।');
      fetchClasses();
      fetchMyHolds();
    } catch (err: any) {
      showAlert('error', err.message || 'আসন সংরক্ষণ করা যায়নি।');
      fetchClasses();
    }
  };

  const handleHoldUpdated = () => {
    fetchClasses();
    fetchMyHolds();
  };

  // ── Admin actions ────────────────────────────────────────────────────────

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
    showAlert('info', 'অ্যাডমিন অ্যাকাউন্ট থেকে লগআউট সম্পন্ন হয়েছে।');
  };

  // ── Views ────────────────────────────────────────────────────────────────

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onSelectStudentFlow={handleStudentFlowStart}
          onSelectAdminFlow={() => setCurrentView('admin-login')}
        />
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

  // Student Entry: enter birth cert number → lookup profile
  if (currentView === 'student-entry') {
    // Profile already found — show confirmation card
    if (studentProfile) {
      return (
        <>
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-lg">
              <h2 className="text-center text-xl font-bold text-gray-900 mb-2">আপনার প্রোফাইল</h2>
              <p className="text-center text-sm text-gray-500 mb-6">তথ্য যাচাই করুন, তারপর ভর্তির আবেদন করুন।</p>
              <StudentProfileCard profile={studentProfile} onContinue={handleProfileConfirmed} />
              <button
                onClick={handleStudentLogout}
                className="mt-4 w-full max-w-lg text-center text-sm text-gray-400 hover:text-gray-600"
              >
                অন্য জন্ম নিবন্ধন নম্বর ব্যবহার করুন
              </button>
            </div>
          </div>
          <Notification alert={alert} onClose={() => setAlert(null)} />
        </>
      );
    }

    // No profile yet — show birth cert entry
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900">ভর্তির আবেদন শুরু করুন</h1>
              <p className="text-sm text-gray-500 mt-1">প্রথমে আপনার জন্ম নিবন্ধন নম্বর দিন</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  জন্ম নিবন্ধন নম্বর (১৭ অঙ্ক) *
                </label>
                <input
                  type="text"
                  value={entryBirthCert}
                  onChange={e => setEntryBirthCert(e.target.value.replace(/\D/g, '').slice(0, 17))}
                  onKeyDown={e => e.key === 'Enter' && handleEntrySubmit()}
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-mono text-lg text-gray-900 outline-none transition-colors"
                  placeholder="17-digit number"
                  maxLength={17}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{entryBirthCert.length} / 17</p>
              </div>

              <button
                onClick={handleEntrySubmit}
                disabled={entryLoading || entryBirthCert.length !== 17}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {entryLoading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '→'}
                {entryLoading ? 'খোঁজা হচ্ছে...' : 'পরবর্তী ধাপ'}
              </button>

              <button
                onClick={() => setCurrentView('landing')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                ← পিছে ফিরুন
              </button>
            </div>
          </div>
        </div>
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

  if (currentView === 'register') {
    return (
      <>
        <StudentRegister
          birthCertNo={entryBirthCert}
          onRegistered={handleProfileRegistered}
          onBack={() => setCurrentView('student-entry')}
          onError={(msg) => showAlert('error', msg)}
        />
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

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

  if (currentView === 'admin-dashboard') {
    return (
      <>
        <AdminDashboard
          adminUsername={adminUsername}
          onLogout={handleAdminLogout}
          onGoToHome={() => setCurrentView('student-entry')}
          onSuccess={(msg) => showAlert('success', msg)}
          onError={(msg) => showAlert('error', msg)}
        />
        <Notification alert={alert} onClose={() => setAlert(null)} />
      </>
    );
  }

  // ── View: Student Admission ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StudentIdBar studentId={studentId} onStudentIdChange={() => {}} />

      {/* Profile banner */}
      {studentProfile && (
        <div className="bg-indigo-600 text-white text-xs px-4 py-1.5 flex items-center justify-between gap-2">
          <span>
            👤 <strong>{studentProfile.fullName}</strong> — {studentProfile.birthCertificateNo}
          </span>
          <button
            onClick={handleStudentLogout}
            className="text-indigo-200 hover:text-white underline"
          >
            লগআউট
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'classes' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">ভর্তিযোগ্য শ্রেণিসমূহ (Available Classes & Shifts)</h2>
              <p className="text-xs text-gray-500">আসন সংখ্যা প্রতি ৩ সেকেন্ড পরপর স্বয়ংক্রিয়ভাবে আপডেট হয়।</p>
            </div>
            <ClassList
              classes={classes}
              loading={loadingClasses}
              studentId={studentId}
              onApply={handleApply}
            />
          </div>
        )}

        {activeTab === 'my-applications' && (
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
        )}
      </main>

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

      <Notification alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
};

export default App;
