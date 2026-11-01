export type Role = "ADMIN" | "STUDENT";

export interface User {
  id: string;
  username: string;
  fullName: string;
  mobileNumber: string;
  profilePicUrl: string | null;
  role: Role;
}

export interface Exam {
  id: string;
  title: string;
  durationInMinutes: number;
  correctMarks: number; // marks for a correct answer
  negativeMarks: number; // marks deducted for a wrong answer
  questionCount?: number;
  totalMarks?: number; // questionCount * correctMarks
}

export interface Question {
  id: string;
  examId?: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface ChartPoint {
  label: string;
  value: number;
}

/** A result as shown to the student */
export interface StudentResult {
  id: string;
  examId: string | null;
  examTitle: string;
  scoreAchieved: number;
  totalMarks: number;
  correctMarks: number;
  negativeMarks: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  passed: boolean;
  submissionTime: string;
}

/** A result as shown to the admin */
export interface AdminResult {
  id: string;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
  examId: string | null;
  examTitle: string;
  scoreAchieved: number;
  totalMarks: number;
  percentage: number;
  submissionTime: string;
}

export interface ReviewQuestion extends Question {
  selectedOption: number;
}
