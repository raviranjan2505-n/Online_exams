"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Alert, MarkingScheme, State } from "@/components/ui";
import { api } from "@/lib/api";
import { Exam, Question } from "@/lib/types";
import { errMsg, useFetch } from "@/lib/useFetch";

export default function ManageQuestions() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch<{ exam: Exam; questions: Question[] }>(`/admin/exams/${id}/questions`);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function remove(q: Question) {
    if (!confirm("Delete this question?")) return;
    setMsg("");
    setErr("");
    try {
      const r = await api<{ message: string }>(`/admin/questions/${q.id}`, { method: "DELETE" });
      setMsg(r.message);
      reload();
    } catch (x) {
      setErr(errMsg(x)); // e.g. "already answered by students"
    }
  }

  return (
    <>
      <div className="row between mb">
        <h2 style={{ margin: 0 }}>Questions{data ? ` — ${data.exam.title}` : ""}</h2>
        <div className="actions">
          <Link href="/admin/exams" className="btn btn-outline">
            ← Back
          </Link>
          <Link href={`/admin/exams/${id}/questions/new`} className="btn btn-primary">
            + Add Question
          </Link>
        </div>
      </div>
      {data && (
        <p className="muted">
          Marking: <MarkingScheme correct={data.exam.correctMarks} negative={data.exam.negativeMarks} /> · {data.exam.questionCount} questions · Total{" "}
          <strong>{data.exam.totalMarks}</strong> marks
        </p>
      )}
      <Alert kind="success">{msg}</Alert>
      <Alert>{err}</Alert>
      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          {data.questions.length === 0 ? (
            <div className="empty">No questions yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Correct</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.questions.map((q, i) => (
                    <tr key={q.id}>
                      <td>{i + 1}</td>
                      <td>{q.text}</td>
                      <td>
                        {q.correctAnswer}. {q.options[q.correctAnswer - 1]}
                      </td>
                      <td>
                        <div className="actions">
                          <Link className="btn btn-sm btn-warning" href={`/admin/questions/${q.id}/edit`}>
                            Edit
                          </Link>
                          <button className="btn btn-sm btn-danger" onClick={() => remove(q)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
