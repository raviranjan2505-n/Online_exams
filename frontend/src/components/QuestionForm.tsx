"use client";

import { FormEvent, useState } from "react";
import { Alert } from "./ui";

export interface QuestionFormValues {
  text: string;
  options: string[];
  correctAnswer: number;
}

export default function QuestionForm({
  initial,
  submitLabel,
  resetOnSuccess,
  onSubmit,
}: {
  initial?: QuestionFormValues;
  submitLabel: string;
  resetOnSuccess?: boolean;
  onSubmit: (v: QuestionFormValues) => Promise<void>;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [correct, setCorrect] = useState(String(initial?.correctAnswer ?? 1));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit({ text, options, correctAnswer: Number(correct) });
      if (resetOnSuccess) {
        setText("");
        setOptions(["", "", "", ""]);
        setCorrect("1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Alert>{error}</Alert>
      <div className="field">
        <label>Question Text</label>
        <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1024} required />
      </div>
      {options.map((o, i) => (
        <div className="field" key={i}>
          <label>Option {i + 1}</label>
          <input
            className="input"
            value={o}
            onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
            required
          />
        </div>
      ))}
      <div className="field">
        <label>Correct Answer</label>
        <select className="input" value={correct} onChange={(e) => setCorrect(e.target.value)}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              Option {n}
            </option>
          ))}
        </select>
        <div className="hint">Marks are set per exam (correct / negative), not per question.</div>
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
