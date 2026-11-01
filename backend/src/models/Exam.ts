import { Schema, model } from "mongoose";

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    durationInMinutes: { type: Number, required: true, min: 1 },
    // Marking scheme: +correctMarks per correct answer, -negativeMarks per wrong answer, 0 if unattempted
    correctMarks: { type: Number, required: true, min: 1, default: 4 },
    negativeMarks: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

export const Exam = model("Exam", examSchema);
