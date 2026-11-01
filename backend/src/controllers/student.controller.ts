import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { toWebPath, uploadDir } from "../middleware/upload";
import { Exam } from "../models/Exam";
import { ExamResult } from "../models/ExamResult";
import { Question } from "../models/Question";
import { publicUser } from "../models/User";
import { asyncHandler, assertId, HttpError, str } from "../utils/http";
import {
  PASS_PERCENT,
  percent,
  serializeExam,
  serializeQuestion,
  serializeQuestionForExam,
} from "../utils/serialize";

const me = (req: Request) => req.user!;

interface PopulatedResult {
  _id: unknown;
  exam?: { _id: unknown; title: string; durationInMinutes: number } | null;
  scoreAchieved: number;
  totalMarks: number;
  correctMarks?: number;
  negativeMarks?: number;
  correctCount?: number;
  incorrectCount?: number;
  unattemptedCount?: number;
  submissionTime: Date;
}

const serializeResult = (r: PopulatedResult) => ({
  id: String(r._id),
  examId: r.exam ? String(r.exam._id) : null,
  examTitle: r.exam?.title || "(deleted exam)",
  scoreAchieved: r.scoreAchieved,
  totalMarks: r.totalMarks,
  correctMarks: r.correctMarks ?? 1,
  negativeMarks: r.negativeMarks ?? 0,
  correctCount: r.correctCount ?? 0,
  incorrectCount: r.incorrectCount ?? 0,
  unattemptedCount: r.unattemptedCount ?? 0,
  percentage: percent(r.scoreAchieved, r.totalMarks),
  passed: percent(r.scoreAchieved, r.totalMarks) >= PASS_PERCENT,
  submissionTime: r.submissionTime,
});

// GET /api/student/dashboard
export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const student = me(req);

  const results = await ExamResult.find({ student: student._id })
    .sort({ submissionTime: -1 })
    .populate("exam", "title durationInMinutes")
    .lean();
  const past = results.map((r) => serializeResult(r as never));

  const totalTaken = past.length;
  const totalScore = past.reduce((s, r) => s + r.scoreAchieved, 0);
  const totalPossible = past.reduce((s, r) => s + r.totalMarks, 0);
  const highestScore = past.reduce((m, r) => Math.max(m, Math.floor(r.percentage)), 0);
  const averageScore = totalPossible > 0 ? (totalScore * 100) / totalPossible : 0;

  // available = every exam the student hasn't taken yet
  const takenIds = results.map((r) => r.exam && (r.exam as unknown as { _id: unknown })._id).filter(Boolean);
  const [available, qCounts] = await Promise.all([
    Exam.find({ _id: { $nin: takenIds } }).sort({ createdAt: -1 }).lean(),
    Question.aggregate<{ _id: unknown; count: number }>([{ $group: { _id: "$exam", count: { $sum: 1 } } }]),
  ]);
  const counts = new Map(qCounts.map((c) => [String(c._id), c.count]));

  res.json({
    student: publicUser(student),
    totalTaken,
    averageScore,
    highestScore,
    // oldest first for the chart
    chart: [...past].reverse().map((r) => ({ label: r.examTitle, value: Math.floor(r.percentage) })),
    pastResults: past,
    availableExams: available.map((e) => serializeExam(e, counts.get(String(e._id)) || 0)),
  });
});

// GET /api/student/results
export const myResults = asyncHandler(async (req: Request, res: Response) => {
  const results = await ExamResult.find({ student: me(req)._id })
    .sort({ submissionTime: -1 })
    .populate("exam", "title durationInMinutes")
    .lean();
  res.json({ results: results.map((r) => serializeResult(r as never)) });
});

// GET /api/student/results/:id  -- summary + full review (questions, correct answers, student's answers)
export const reviewResult = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Result");
  const result = await ExamResult.findById(id).populate("exam", "title durationInMinutes").lean();
  if (!result) throw new HttpError(404, "Result not found");
  // a student may only see their own result
  if (String(result.student) !== String(me(req)._id)) throw new HttpError(403, "You are not authorized to review that exam result.");

  const questions = await Question.find({ exam: (result.exam as unknown as { _id: unknown })?._id }).sort({ createdAt: 1 }).lean();
  const chosen = new Map(result.answers.map((a) => [String(a.question), a.selectedOption]));

  res.json({
    result: serializeResult(result as never),
    questions: questions.map((q) => ({ ...serializeQuestion(q), selectedOption: chosen.get(String(q._id)) ?? 0 })),
  });
});

/* ----------------------------- taking an exam ----------------------------- */

// GET /api/student/exams/:id  -- exam + questions WITHOUT correct answers
export const startExam = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Exam");
  const exam = await Exam.findById(id).lean();
  if (!exam) throw new HttpError(404, "Exam not found");

  const existing = await ExamResult.findOne({ student: me(req)._id, exam: id }).select("_id").lean();
  if (existing) throw new HttpError(409, "You have already taken this exam.");

  const questions = await Question.find({ exam: id }).sort({ createdAt: 1 }).lean();
  if (questions.length === 0) throw new HttpError(400, "This exam has no questions yet.");

  res.json({
    student: publicUser(me(req)),
    exam: serializeExam(exam, questions.length),
    questions: questions.map(serializeQuestionForExam),
  });
});

// POST /api/student/exams/:id/submit   body: { answers: { [questionId]: 1..4 } }
export const submitExam = asyncHandler(async (req: Request, res: Response) => {
  const id = assertId(req.params.id, "Exam");
  const exam = await Exam.findById(id).lean();
  if (!exam) throw new HttpError(404, "Exam not found");

  const submitted: Record<string, unknown> =
    req.body && typeof req.body.answers === "object" && req.body.answers !== null ? req.body.answers : {};

  const questions = await Question.find({ exam: id }).sort({ createdAt: 1 }).lean();

  // Marking scheme: +correctMarks right, -negativeMarks wrong, 0 unattempted
  const { correctMarks, negativeMarks } = exam;
  const totalMarks = questions.length * correctMarks;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  const answers = questions.map((q) => {
    const n = Number(submitted[String(q._id)]);
    const selectedOption = Number.isInteger(n) && n >= 1 && n <= 4 ? n : 0; // 0 = unanswered
    if (selectedOption === 0) unattemptedCount++;
    else if (selectedOption === q.correctAnswer) correctCount++;
    else incorrectCount++;
    return { question: q._id, selectedOption };
  });
  const scoreAchieved = correctCount * correctMarks - incorrectCount * negativeMarks;

  // The unique (student, exam) index guarantees only one attempt even with double-clicks.
  let result;
  try {
    result = await ExamResult.create({
      student: me(req)._id,
      exam: id,
      scoreAchieved,
      totalMarks,
      correctMarks,
      negativeMarks,
      correctCount,
      incorrectCount,
      unattemptedCount,
      submissionTime: new Date(),
      answers,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw new HttpError(409, "You have already submitted this exam.");
    throw err;
  }

  res.status(201).json({ resultId: String(result._id), scoreAchieved, totalMarks });
});

/* ----------------------------- profile ----------------------------- */

// GET /api/student/profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: publicUser(me(req)) });
});

// PUT /api/student/profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const student = me(req);
  student.fullName = str(req.body.fullName);
  student.mobileNumber = str(req.body.mobileNumber);
  await student.save();
  res.json({ message: "Profile details updated successfully!", user: publicUser(student) });
});

// POST /api/student/profile/picture  (multipart/form-data, field "profilePic")
export const updatePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new HttpError(400, "Please select a file to upload.");
  const student = me(req);
  const old = student.profilePicUrl;
  student.profilePicUrl = toWebPath(req.file);
  await student.save();
  if (old?.startsWith("/uploads/")) fs.unlink(path.join(uploadDir, path.basename(old)), () => undefined);
  res.json({ message: "Profile picture updated successfully!", user: publicUser(student) });
});

// POST /api/student/profile/password
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword, confirmPassword } = req.body as Record<string, string | undefined>;
  const student = me(req);

  if (!newPassword || newPassword.length < 6) throw new HttpError(400, "New password must be at least 6 characters.");
  if (newPassword !== confirmPassword) throw new HttpError(400, "New passwords do not match.");
  if (!oldPassword || !(await bcrypt.compare(oldPassword, student.password))) throw new HttpError(400, "Incorrect old password.");

  student.password = await bcrypt.hash(newPassword, 10);
  await student.save();
  res.json({ message: "Password updated successfully!" });
});
