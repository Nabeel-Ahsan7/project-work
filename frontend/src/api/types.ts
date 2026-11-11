export interface SchoolClass {
  id: string;
  name: string;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

export interface CreateClassPayload {
  name: string;
  totalSeats: number;
}

export interface HoldResponse {
  holdId: string;
  classId: string;
  studentId?: string;
  status: 'HELD' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
}

export interface MeHold {
  holdId: string;
  classId: string;
  className: string;
  status: 'HELD' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
}

export interface ApiError {
  message: string;
}

// Admin & Relational Management Types
export interface AdminLoginResponse {
  token: string;
  username: string;
}

export interface AcademicClass {
  id: string;
  name: string;
}

export interface AcademicShift {
  id: string;
  name: string;
}

export interface CreateSessionPayload {
  classLevelId: string;
  shiftId: string;
  totalSeats: number;
}
