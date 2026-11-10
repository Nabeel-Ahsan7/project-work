import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentIdBar } from '../StudentIdBar';

describe('StudentIdBar component', () => {
  it('renders student ID input correctly', () => {
    const fn = vi.fn();
    render(<StudentIdBar studentId="" onStudentIdChange={fn} />);

    expect(screen.getByPlaceholderText(/20152691234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/১৭ ডিজিট প্রয়োজন/i)).toBeInTheDocument();
  });

  it('marks student ID as active when exactly 17 digits entered', () => {
    const fn = vi.fn();
    render(<StudentIdBar studentId="20152691234567890" onStudentIdChange={fn} />);

    expect(screen.getByText(/শিক্ষার্থী সক্রিয়/i)).toBeInTheDocument();
  });

  it('strips non-numeric characters and triggers change event', () => {
    const fn = vi.fn();
    render(<StudentIdBar studentId="" onStudentIdChange={fn} />);

    const input = screen.getByPlaceholderText(/20152691234567890/i);
    fireEvent.change(input, { target: { value: '2015abc269' } });

    expect(fn).toHaveBeenCalledWith('2015269');
  });
});
