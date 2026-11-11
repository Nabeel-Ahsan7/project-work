import React, { useState } from 'react';
import { UserPlus, ArrowLeft, User, Calendar, Phone, MapPin, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { Gender, RegisterStudentPayload, StudentProfile } from '../api/types';

interface Props {
  birthCertNo: string; // pre-filled from landing
  onRegistered: (profile: StudentProfile) => void;
  onBack: () => void;
  onError: (msg: string) => void;
}

interface FieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
}

const Field: React.FC<FieldProps> = ({ label, id, children, error }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export const StudentRegister: React.FC<Props> = ({ birthCertNo, onRegistered, onBack, onError }) => {
  const [form, setForm] = useState<RegisterStudentPayload>({
    birthCertificateNo: birthCertNo,
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    fatherName: '',
    motherName: '',
    guardianPhone: '',
    presentAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterStudentPayload, string>>>({});

  const set = (field: keyof RegisterStudentPayload, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof RegisterStudentPayload, string>> = {};
    if (!/^\d{17}$/.test(form.birthCertificateNo))
      e.birthCertificateNo = 'জন্ম নিবন্ধন নম্বর অবশ্যই ১৭ অঙ্কের হতে হবে';
    if (form.fullName.trim().length < 2)
      e.fullName = 'পূর্ণ নাম দিন';
    if (!form.dateOfBirth)
      e.dateOfBirth = 'জন্ম তারিখ বাধ্যতামূলক';
    if (form.fatherName.trim().length < 2)
      e.fatherName = 'পিতার নাম দিন';
    if (form.motherName.trim().length < 2)
      e.motherName = 'মাতার নাম দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: RegisterStudentPayload = {
        ...form,
        fullName: form.fullName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        guardianPhone: form.guardianPhone?.trim() || undefined,
        presentAddress: form.presentAddress?.trim() || undefined,
        gender: form.gender as Gender
      };
      const profile = await api.registerStudent(payload);
      onRegistered(profile);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        onError('এই জন্ম নিবন্ধন নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।');
      } else {
        onError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">শিক্ষার্থী নিবন্ধন</h1>
              <p className="text-xs text-gray-500">Student Registration</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <p className="text-sm text-gray-600 mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            📋 ভর্তির আবেদন করতে আপনার সম্পূর্ণ প্রোফাইল তৈরি করুন। সকল তথ্য সঠিকভাবে পূরণ করুন।
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Birth Certificate */}
            <Field label="জন্ম নিবন্ধন নম্বর (১৭ অঙ্ক) *" id="birthCertNo" error={errors.birthCertificateNo}>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-indigo-50">
                <User className="w-4 h-4 text-indigo-500 shrink-0" />
                <input
                  id="birthCertNo"
                  type="text"
                  value={form.birthCertificateNo}
                  onChange={e => set('birthCertificateNo', e.target.value.replace(/\D/g, '').slice(0, 17))}
                  className="flex-1 bg-transparent text-sm font-mono text-gray-900 outline-none"
                  placeholder="17-digit birth certificate number"
                  maxLength={17}
                />
                <span className="text-xs text-gray-400">{form.birthCertificateNo.length}/17</span>
              </div>
            </Field>

            {/* Full Name */}
            <Field label="শিক্ষার্থীর পূর্ণ নাম *" id="fullName" error={errors.fullName}>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="Student's full name"
              />
            </Field>

            {/* DOB + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="জন্ম তারিখ *" id="dob" error={errors.dateOfBirth}>
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    id="dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => set('dateOfBirth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
                  />
                </div>
              </Field>

              <Field label="লিঙ্গ *" id="gender" error={errors.gender}>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={e => set('gender', e.target.value as Gender)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="MALE">পুরুষ (Male)</option>
                  <option value="FEMALE">মহিলা (Female)</option>
                  <option value="OTHER">অন্যান্য (Other)</option>
                </select>
              </Field>
            </div>

            {/* Father / Mother */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="পিতার নাম *" id="fatherName" error={errors.fatherName}>
                <input
                  id="fatherName"
                  type="text"
                  value={form.fatherName}
                  onChange={e => set('fatherName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Father's name"
                />
              </Field>
              <Field label="মাতার নাম *" id="motherName" error={errors.motherName}>
                <input
                  id="motherName"
                  type="text"
                  value={form.motherName}
                  onChange={e => set('motherName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Mother's name"
                />
              </Field>
            </div>

            {/* Phone */}
            <Field label="অভিভাবকের মোবাইল নম্বর" id="phone" error={errors.guardianPhone}>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  id="phone"
                  type="tel"
                  value={form.guardianPhone}
                  onChange={e => set('guardianPhone', e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
                  placeholder="+880 1X XX XX XX XX"
                />
              </div>
            </Field>

            {/* Address */}
            <Field label="বর্তমান ঠিকানা" id="address" error={errors.presentAddress}>
              <div className="flex items-start gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <textarea
                  id="address"
                  value={form.presentAddress}
                  onChange={e => set('presentAddress', e.target.value)}
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none resize-none"
                  placeholder="Village / Road, Upazila, District"
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <UserPlus className="w-4 h-4" />}
              {loading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন সম্পন্ন করুন'}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
