import { Schema, model } from "mongoose";

const answerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    // 0 = unanswered
    selectedOption: { type: Number, required: true, min: 0, max: 4, default: 0 },
  },
  { _id: false }
);

const examResultSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    scoreAchieved: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true, default: 0 },
    // Snapshot of the scheme used, so later admin edits never change old results
    correctMarks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, required: true, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    submissionTime: { type: Date, required: true, default: Date.now },
    answers: { type: [answerSchema], default: [] },
  },
  { timestamps: true }
);

// A student can attempt each exam only once
examResultSchema.index({ student: 1, exam: 1 }, { unique: true });
// Lets us quickly check "has this question ever been answered?"
examResultSchema.index({ "answers.question": 1 });

export const ExamResult = model("ExamResult", examResultSchema);
