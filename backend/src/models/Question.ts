import { Schema, model } from "mongoose";

const questionSchema = new Schema(
  {
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 1024 },
    // exactly 4 options
    options: {
      type: [String],
      required: true,
      validate: (v: string[]) => v.length === 4 && v.every((o) => o && o.trim().length > 0),
    },
    // 1..4 (1 = first option), same convention as the Java app
    correctAnswer: { type: Number, required: true, min: 1, max: 4 },
  },
  { timestamps: true }
);

export const Question = model("Question", questionSchema);
