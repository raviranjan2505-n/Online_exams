"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Avatar, MarkingScheme, State } from "@/components/ui";
import { api } from "@/lib/api";
import { Exam, ExamQuestion, User } from "@/lib/types";
import { errMsg, useFetch } from "@/lib/useFetch";

interface ExamData {
  student: User;
  exam: Exam;
  questions: ExamQuestion[];
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function TakeExam() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useFetch<ExamData>(`/student/exams/${id}`);

  if (loading || error || !data) {
    return (
      <>
        <State loading={loading} error={error} />
        {error && (
          <Link href="/student/dashboard" className="btn btn-outline">
            ← Back to dashboard
          </Link>
        )}
      </>
    );
  }
  return <ExamRunner examId={id} data={data} />;
}

function ExamRunner({ examId, data }: { examId: string; data: ExamData }) {
  const router = useRouter();
  const { student, exam, questions } = data;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.durationInMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setErr("");
    try {
      const r = await api<{ resultId: string }>(`/student/exams/${examId}/submit`, {
        method: "POST",
        body: { answers: answersRef.current },
      });
      router.replace(`/student/result/${r.resultId}`);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setErr(errMsg(e));
    }
  }, [examId, router]);

  // Countdown based on a fixed deadline, so it can't drift or pause in a background tab.
  const deadline = useRef(Date.now() + exam.durationInMinutes * 60 * 1000);
  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(t);
        submit(); // auto-submit when time is up
      }
    }, 1000);
    return () => clearInterval(t);
  }, [submit]);

  const answeredCount = Object.keys(answers).length;
  const q = questions[current];

  function handleSubmit() {
    const unanswered = questions.length - answeredCount;
    const text = unanswered > 0 ? `You have ${unanswered} unanswered question(s). Submit anyway?` : "Submit your exam?";
    if (confirm(text)) submit();
  }

  return (
    <>
      <div className="card mb">
        <div className="card-body">
          <div className="row">
            <Avatar url={student.profilePicUrl} name={student.fullName || student.username} size={64} />
            <div>
              <h4 style={{ margin: 0 }}>{student.fullName || student.username}</h4>
              <div className="muted small">Email: {student.username}</div>
              {student.mobileNumber && <div className="muted small">Mobile: {student.mobileNumber}</div>}
            </div>
          </div>
          <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "14px 0" }} />
          <div className="row between small">
            <span>
              <strong>EXAM:</strong> {exam.title}
            </span>
            <span>
              <strong>TOTAL TIME:</strong> {exam.durationInMinutes} minutes
            </span>
            <span>
              <strong>TOTAL QUESTIONS:</strong> {questions.length}
            </span>
            <span>
              <strong>TOTAL MARKS:</strong> {exam.totalMarks}
            </span>
          </div>
          <div className="small mt-s">
            <strong>MARKING SCHEME:</strong> <MarkingScheme correct={exam.correctMarks} negative={exam.negativeMarks} />
          </div>
        </div>
      </div>

      <Alert>{err}</Alert>

      <div className="exam-layout">
        <div className="q-area">
          <div className="card">
            <div className="card-header">
              Question {current + 1} of {questions.length} (+{exam.correctMarks} / −{exam.negativeMarks})
            </div>
            <div className="card-body">
              <p style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: 20 }}>{q.text}</p>
              {q.options.map((opt, i) => {
                const n = i + 1;
                const selected = answers[q.id] === n;
                return (
                  <label key={n} className={`option ${selected ? "selected" : ""}`}>
                    <input type="radio" name={`q_${q.id}`} checked={selected} onChange={() => setAnswers({ ...answers, [q.id]: n })} />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="row between mt">
            <button className="btn btn-lg" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              ← Previous
            </button>
            <button className="btn btn-primary btn-lg" disabled={current === questions.length - 1} onClick={() => setCurrent(current + 1)}>
              Next →
            </button>
          </div>
        </div>

        <div className="p-area card">
          <div className="card-body" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="timer-label">Time Left</div>
            <div className="timer">
              {pad(Math.floor(secondsLeft / 60))}:{pad(secondsLeft % 60)}
            </div>
          </div>
          <div className="card-body">
            <strong style={{ display: "block", marginBottom: 10 }}>
              Question Palette ({answeredCount}/{questions.length})
            </strong>
            <div className="palette">
              {questions.map((qq, i) => (
                <button
                  key={qq.id}
                  type="button"
                  className={`pbtn ${i === current ? "active" : ""} ${answers[qq.id] ? "answered" : ""}`}
                  onClick={() => setCurrent(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button className="btn btn-success btn-lg btn-block mt" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Submitting…" : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
