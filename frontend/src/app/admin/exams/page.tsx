"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, MarkingScheme, State } from "@/components/ui";
import { api } from "@/lib/api";
import { Exam } from "@/lib/types";
import { errMsg, useFetch } from "@/lib/useFetch";

export default function ManageExams() {
  const { data, loading, error, reload } = useFetch<{ exams: Exam[] }>("/admin/exams");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function remove(e: Exam) {
    if (!confirm(`Delete "${e.title}"? This also deletes all its questions and student results.`)) return;
    setMsg("");
    setErr("");
    try {
      await api(`/admin/exams/${e.id}`, { method: "DELETE" });
      setMsg("Exam deleted.");
      reload();
    } catch (x) {
      setErr(errMsg(x));
    }
  }

  return (
    <>
      <div className="row between mb">
        <h2 style={{ margin: 0 }}>Manage Exams</h2>
        <Link href="/admin/exams/new" className="btn btn-primary">
          + Add New Exam
        </Link>
      </div>
      <Alert kind="success">{msg}</Alert>
      <Alert>{err}</Alert>
      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          {data.exams.length === 0 ? (
            <div className="empty">No exams yet. Create your first one.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Questions</th>
                    <th>Marking</th>
                    <th>Total Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.exams.map((e) => (
                    <tr key={e.id}>
                      <td>{e.title}</td>
                      <td>{e.durationInMinutes} min</td>
                      <td>{e.questionCount}</td>
                      <td className="small">
                        <MarkingScheme correct={e.correctMarks} negative={e.negativeMarks} />
                      </td>
                      <td>{e.totalMarks}</td>
                      <td>
                        <div className="actions">
                          <Link className="btn btn-sm btn-primary" href={`/admin/exams/${e.id}/questions`}>
                            Questions
                          </Link>
                          <Link className="btn btn-sm btn-success" href={`/admin/exams/${e.id}/results`}>
                            Results
                          </Link>
                          <Link className="btn btn-sm btn-warning" href={`/admin/exams/${e.id}/edit`}>
                            Edit
                          </Link>
                          <button className="btn btn-sm btn-danger" onClick={() => remove(e)}>
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
