"use client";

import Link from "next/link";
import { fmtDate, PassBadge, State } from "@/components/ui";
import { StudentResult } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

export default function MyResults() {
  const { data, loading, error } = useFetch<{ results: StudentResult[] }>("/student/results");

  return (
    <>
      <h2>My Results</h2>
      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          {data.results.length === 0 ? (
            <div className="empty">You haven&apos;t taken any exams yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => (
                    <tr key={r.id}>
                      <td>{r.examTitle}</td>
                      <td>
                        {r.scoreAchieved} / {r.totalMarks}
                      </td>
                      <td>{r.percentage.toFixed(1)}%</td>
                      <td>
                        <PassBadge passed={r.passed} />
                      </td>
                      <td>{fmtDate(r.submissionTime)}</td>
                      <td>
                        <Link href={`/student/review/${r.id}`} className="btn btn-sm btn-primary">
                          Review
                        </Link>
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
