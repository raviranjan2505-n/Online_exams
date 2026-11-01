"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { fmtDate, State } from "@/components/ui";
import { AdminResult, Exam } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

export default function ExamResults() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useFetch<{ exam: Exam; results: AdminResult[] }>(`/admin/exams/${id}/results`);

  return (
    <>
      <div className="row between mb">
        <h2 style={{ margin: 0 }}>Results{data ? ` — ${data.exam.title}` : ""}</h2>
        <Link href="/admin/exams" className="btn btn-outline">
          ← Back
        </Link>
      </div>
      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          {data.results.length === 0 ? (
            <div className="empty">No student has taken this exam yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => (
                    <tr key={r.id}>
                      <td>{r.studentName}</td>
                      <td>{r.studentEmail}</td>
                      <td>
                        {r.scoreAchieved} / {r.totalMarks}
                      </td>
                      <td>{r.percentage.toFixed(1)}%</td>
                      <td>{fmtDate(r.submissionTime)}</td>
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
