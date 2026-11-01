export const PASS_PERCENT = 50;

// Negative marking can push the score below 0; the percentage is floored at 0.
export const percent = (score: number, total: number) => (total > 0 ? Math.max(0, (score * 100) / total) : 0);

interface ExamLike {
  _id: unknown;
  title: string;
  durationInMinutes: number;
  correctMarks?: number;
  negativeMarks?: number;
}

export const serializeExam = (e: ExamLike, questionCount?: number) => {
  const correctMarks = e.correctMarks ?? 1;
  return {
    id: String(e._id),
    title: e.title,
    durationInMinutes: e.durationInMinutes,
    correctMarks,
    negativeMarks: e.negativeMarks ?? 0,
    ...(questionCount === undefined ? {} : { questionCount, totalMarks: questionCount * correctMarks }),
  };
};

interface QuestionLike {
  _id: unknown;
  exam?: unknown;
  text: string;
  options: string[];
  correctAnswer: number;
}

/** Full question (admin / review). */
export const serializeQuestion = (q: QuestionLike) => ({
  id: String(q._id),
  examId: q.exam ? String(q.exam) : undefined,
  text: q.text,
  options: q.options,
  correctAnswer: q.correctAnswer,
});

/** Question as shown to a student taking the exam: no correct answer. */
export const serializeQuestionForExam = (q: QuestionLike) => ({
  id: String(q._id),
  text: q.text,
  options: q.options,
});
