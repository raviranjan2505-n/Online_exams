import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { uploadDir } from "../middleware/upload";
import { Exam } from "../models/Exam";
import { ExamResult } from "../models/ExamResult";
import { Question } from "../models/Question";
import { publicUser, User } from "../models/User";
import { asyncHandler, assertId, HttpError, str } from "../utils/http";
import { percent, serializeExam, serializeQuestion } from "../utils/serialize";

/* ----------------------------- helpers ----------------------------- */

function parseQuestionBody(body: Record<string, unknown>) {
  const text = str(body.text);
  const options = Array.isArray(body.options) ? body.options.map(str) : [];
  const correctAnswer = Number(body.correctAnswer);

  if (!text) throw new HttpError(400, "Question text is required");
  if (options.length !== 4 || options.some((o) => !o)) throw new HttpError(400, "All 4 options are required");
  if (!Number.isInteger(correctAnswer) || correctAnswer < 1 || correctAnswer > 4)
    throw new HttpError(400, "Correct answer must be between 1 and 4");

  return { text, options, correctAnswer };
}

function parseExamBody(body: Record<string, unknown>) {
  const title = str(body.title);
  const durationInMinutes = Number(body.durationInMinutes);
  const correctMarks = Number(body.correctMarks);
  const negativeMarks = Number(body.negativeMarks ?? 0);
  if (!title) throw new HttpError(400, "Title is required");
  if (!Number.isInteger(durationInMinutes) || durationInMinutes < 1)
    throw new HttpError(400, "Duration must be a positive whole number of minutes");
  if (!Number.isFinite(correctMarks) || correctMarks <= 0) throw new HttpError(400, "Marks per correct answer must be greater than 0");
  if (!Number.isFinite(negativeMarks) || negativeMarks < 0) throw new HttpError(400, "Negative marks cannot be less than 0");
  return { title, durationInMinutes, correctMarks, negativeMarks };
}

const serializeResultRow = (r: {
  _id: unknown;
  student?: { _id: unknown; fullName?: string | null; username?: string } | null;
  exam?: { _id: unknown; title?: string } | null;
  scoreAchieved: number;
  totalMarks: number;
  submissionTime: Date;
}) => ({
  id: String(r._id),
  studentId: r.student ? String(r.student._id) : null,
  studentName: r.student?.fullName || r.student?.username || "(deleted student)",
  studentEmail: r.student?.username || "",
  examId: r.exam ? String(r.exam._id) : null,
  examTitle: r.exam?.title || "(deleted exam)",
  scoreAchieved: r.scoreAchieved,
  totalMarks: r.totalMarks,
  percentage: percent(r.scoreAchieved, r.totalMarks),
  submissionTime: r.submissionTime,
});

/* ----------------------------- dashboard ----------------------------- */

// GET /api/admin/dashboard
export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [totalStudents, totalExams, totalQuestions, totalSubmissions, exams, perExam, recent] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    Exam.countDocuments(),
    Question.countDocuments(),
    ExamResult.countDocuments(),
    Exam.find().sort({ createdAt: 1 }).lean(),
    ExamResult.aggregate<{ _id: unknown; count: number }>([{ $group: { _id: "$exam", count: { $sum: 1 } } }]),
    ExamResult.find()
      .sort({ submissionTime: -1 })
      .limit(5)
      .populate("student", "fullName username")
      .populate("exam", "title")
      .lean(),
  ]);

  const counts = new Map(perExam.map((p) => [String(p._id), p.count]));

  res.json({
    totalStudents,
    totalExams,
    totalQuestions,
    totalSubmissions,
    chart: exams.map((e) => ({ label: e.title, value: counts.get(String(e._id)) || 0 })),
    recentResults: recent.map((r) => serializeResultRow(r as never)),
  });
});

/* ----------------------------- exams ----------------------------- */

// GET /api/admin/exams
export const listExams = asyncHandler(async (_req: Request, res: Response) => {
  const [exams, qCounts] = await Promise.all([
    Exam.find().sort({ createdAt: -1 }).lean(),
    Question.aggregate<{ _id: unknown; count: number }>([{ $group: { _id: "$exam", count: { $sum: 1 } } }]),
  ]);
  const counts = new Map(qCounts.map((c) => [String(c._id), c.count]));
  res.json({ exams: exams.map((e) => serializeExam(e, counts.get(String(e._id)) || 0)) });
});

// GET /api/admin/exams/:id
export const getExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findById(assertId(req.params.id, "Exam")).lean();
  if (!exam) throw new HttpError(404, "Exam not found");
  res.json({ exam: serializeExam(exam) });
});

// POST /api/admin/exams
export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.create(parseExamBody(req.body));
  res.status(201).json({ exam: serializeExam(exam) });
});

// PUT /api/admin/exams/:id
export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findByIdAndUpdate(assertId(req.params.id, "Exam"), parseExamBody(req.body), {
    new: true,
    runValidators: true,
  });
  if (!exam) throw new HttpError(404, "Exam not found");
  res.json({ exam: serializeExam(exam) });
});

// DELETE /api/admin/exams/:id  -- cascades to questions and results (like CascadeType.ALL)
export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Exam");
  const exam = await Exam.findByIdAndDelete(id);
  if (!exam) throw new HttpError(404, "Exam not found");
  await Promise.all([Question.deleteMany({ exam: id }), ExamResult.deleteMany({ exam: id })]);
  res.json({ message: "Exam deleted" });
});

// GET /api/admin/exams/:id/results
export const examResults = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Exam");
  const exam = await Exam.findById(id).lean();
  if (!exam) throw new HttpError(404, "Exam not found");
  const results = await ExamResult.find({ exam: id })
    .sort({ submissionTime: -1 })
    .populate("student", "fullName username")
    .populate("exam", "title")
    .lean();
  res.json({ exam: serializeExam(exam), results: results.map((r) => serializeResultRow(r as never)) });
});

/* ----------------------------- questions ----------------------------- */

// GET /api/admin/exams/:id/questions
export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Exam");
  const exam = await Exam.findById(id).lean();
  if (!exam) throw new HttpError(404, "Exam not found");
  const questions = await Question.find({ exam: id }).sort({ createdAt: 1 }).lean();
  res.json({ exam: serializeExam(exam, questions.length), questions: questions.map(serializeQuestion) });
});

// POST /api/admin/exams/:id/questions
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Exam");
  if (!(await Exam.exists({ _id: id }))) throw new HttpError(404, "Exam not found");
  const q = await Question.create({ ...parseQuestionBody(req.body), exam: id });
  res.status(201).json({ question: serializeQuestion(q) });
});

// GET /api/admin/questions/:id
export const getQuestion = asyncHandler(async (req: Request, res: Response) => {
  const q = await Question.findById(assertId(req.params.id, "Question")).lean();
  if (!q) throw new HttpError(404, "Question not found");
  res.json({ question: serializeQuestion(q) });
});

// PUT /api/admin/questions/:id
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const q = await Question.findByIdAndUpdate(assertId(req.params.id, "Question"), parseQuestionBody(req.body), {
    new: true,
    runValidators: true,
  });
  if (!q) throw new HttpError(404, "Question not found");
  res.json({ question: serializeQuestion(q) });
});

// DELETE /api/admin/questions/:id  -- protected if any student has answered it
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Question");
  if (await ExamResult.exists({ "answers.question": id })) {
    throw new HttpError(
      409,
      "Cannot delete this question. It has already been answered by one or more students and is part of their exam results."
    );
  }
  const q = await Question.findByIdAndDelete(id);
  if (!q) throw new HttpError(404, "Question not found");
  res.json({ message: "Question deleted successfully." });
});

/* ----------------------------- students ----------------------------- */

// GET /api/admin/students
export const listStudents = asyncHandler(async (_req: Request, res: Response) => {
  const students = await User.find({ role: "STUDENT" }).sort({ createdAt: -1 }).lean();
  res.json({ students: students.map(publicUser) });
});

// DELETE /api/admin/students/:id  -- removes the student and all their results
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Student");
  const student = await User.findOne({ _id: id, role: "STUDENT" });
  if (!student) throw new HttpError(404, "Student not found");

  await ExamResult.deleteMany({ student: id });
  await student.deleteOne();
  if (student.profilePicUrl?.startsWith("/uploads/")) {
    fs.unlink(path.join(uploadDir, path.basename(student.profilePicUrl)), () => undefined);
  }
  res.json({ message: "Student account and all associated results have been deleted." });
});

// POST /api/admin/students/:id/reset-password
export const resetStudentPassword = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Student");
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
  if (!newPassword) throw new HttpError(400, "Password cannot be empty.");
  if (newPassword.length < 6) throw new HttpError(400, "Password must be at least 6 characters");

  const student = await User.findOne({ _id: id, role: "STUDENT" });
  if (!student) throw new HttpError(404, "Student not found");
  student.password = await bcrypt.hash(newPassword, 10);
  await student.save();
  res.json({ message: `Password for ${student.username} has been reset.` });
});
