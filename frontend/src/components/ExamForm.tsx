"use client";

import { FormEvent, useState } from "react";
import { Alert } from "./ui";

export interface ExamFormValues {
  title: string;
  durationInMinutes: number;
  correctMarks: number;
  negativeMarks: number;
}

export default function ExamForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ExamFormValues;
  submitLabel: string;
  onSubmit: (v: ExamFormValues) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [duration, setDuration] = useState(String(initial?.durationInMinutes ?? 30));
  const [correct, setCorrect] = useState(String(initial?.correctMarks ?? 4));
  const [negative, setNegative] = useState(String(initial?.negativeMarks ?? 1));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit({
        title,
        durationInMinutes: Number(duration),
        correctMarks: Number(correct),
        negativeMarks: Number(negative),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Alert>{error}</Alert>
      <div className="field">
        <label>Exam Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label>Duration (minutes)</label>
        <input className="input" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
      </div>
      <div className="row">
        <div className="field grow">
          <label>Marks for a correct answer (+)</label>
          <input className="input" type="number" min={0.25} step="any" value={correct} onChange={(e) => setCorrect(e.target.value)} required />
        </div>
        <div className="field grow">
          <label>Negative marks per wrong answer (−)</label>
          <input className="input" type="number" min={0} step="any" value={negative} onChange={(e) => setNegative(e.target.value)} required />
          <div className="hint">Enter 0 for no negative marking.</div>
        </div>
      </div>
      <div className="alert alert-info">
        Marking: +{correct || 0} for each correct answer, −{negative || 0} for each wrong answer, 0 for unattempted. Total marks = number of
        questions × {correct || 0}.
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
