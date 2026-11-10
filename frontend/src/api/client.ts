import { SchoolClass, CreateClassPayload, HoldResponse, MeHold } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request<T>(endpoint: string, options: RequestInit = {}, studentId?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (studentId) {
    headers.set('X-Student-Id', studentId);
  }

  const url = `${API_BASE_URL.replace(/\/+$/, '')}${endpoint}`;
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (err) {
    throw new Error('সার্ভারের সাথে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে নিশ্চিত করুন ব্যাকএন্ড চালু আছে। (Cannot connect to server)');
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || response.statusText };
  }

  if (!response.ok) {
    const errorMsg = data.message || `অনুরোধ ব্যর্থ হয়েছে (${response.status}: ${response.statusText})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  getClasses: () => request<SchoolClass[]>('/classes'),
  getClass: (classId: string) => request<SchoolClass>(`/classes/${classId}`),
  createClass: (payload: CreateClassPayload) => request<{ id: string; name: string; totalSeats: number }>('/classes', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  createHold: (classId: string, studentId: string) => request<HoldResponse>(`/classes/${classId}/holds`, {
    method: 'POST'
  }, studentId),
  getHold: (holdId: string) => request<HoldResponse>(`/holds/${holdId}`),
  confirmHold: (holdId: string, studentId: string) => request<{ holdId: string; status: string }>(`/holds/${holdId}/confirm`, {
    method: 'POST'
  }, studentId),
  cancelHold: (holdId: string, studentId: string) => request<void>(`/holds/${holdId}`, {
    method: 'DELETE'
  }, studentId),
  getMyHolds: (studentId: string) => request<MeHold[]>('/me/holds', {
    method: 'GET'
  }, studentId)
};
