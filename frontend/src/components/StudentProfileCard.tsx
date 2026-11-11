import React from 'react';
import { User, Calendar, Users, Phone, MapPin, CheckCircle } from 'lucide-react';
import { StudentProfile } from '../api/types';

interface Props {
  profile: StudentProfile;
  onContinue: () => void;
}

const genderLabel: Record<string, string> = {
  MALE: 'পুরুষ',
  FEMALE: 'মহিলা',
  OTHER: 'অন্যান্য'
};

export const StudentProfileCard: React.FC<Props> = ({ profile, onContinue }) => {
  const dob = new Date(profile.dateOfBirth).toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 max-w-lg mx-auto">
      {/* Verified badge */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm font-semibold text-green-700">প্রোফাইল যাচাই সম্পন্ন</span>
      </div>

      <div className="flex items-start gap-4 mb-5">
        <div className="bg-indigo-100 rounded-full p-3">
          <User className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
          <p className="text-sm text-gray-500 font-mono">{profile.birthCertificateNo}</p>
        </div>
      </div>

      <div className="space-y-2.5 text-sm text-gray-700 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span>জন্ম তারিখ: <strong>{dob}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400 shrink-0" />
          <span>লিঙ্গ: <strong>{genderLabel[profile.gender] ?? profile.gender}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <span>পিতা: <strong>{profile.fatherName}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <span>মাতা: <strong>{profile.motherName}</strong></span>
        </div>
        {profile.guardianPhone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{profile.guardianPhone}</span>
          </div>
        )}
        {profile.presentAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>{profile.presentAddress}</span>
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        ভর্তির আবেদন করুন →
      </button>
    </div>
  );
};
