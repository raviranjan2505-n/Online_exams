"use client";

import Link from "next/link";
import { BarChart, fmtDate, State } from "@/components/ui";
import { useFetch } from "@/lib/useFetch";
import { AdminResult, ChartPoint } from "@/lib/types";

interface Dash {
  totalStudents: number;
  totalExams: number;
  totalQuestions: number;
  totalSubmissions: number;
  chart: ChartPoint[];
  recentResults: AdminResult[];
}

export default function AdminDashboard() {
  const { data, loading, error } = useFetch<Dash>("/admin/dashboard");

  return (
    <>
      <h2>Admin Dashboard</h2>
      <State loading={loading} error={error} />
      {data && (
        <>
          <div className="grid grid-3 mb">
            <div className="card kpi">
              <div className="value text-primary">{data.totalStudents}</div>
              <div className="label">Total Students</div>
            </div>
            <div className="card kpi">
              <div className="value text-success">{data.totalExams}</div>
              <div className="label">Total Exams</div>
            </div>
            <div className="card kpi">
              <div className="value text-warning">{data.totalQuestions}</div>
              <div className="label">Total Questions</div>
            </div>
            <div className="card kpi">
              <div className="value text-danger">{data.totalSubmissions}</div>
              <div className="label">Total Submissions</div>
            </div>
          </div>

          <div className="card mb">
            <div className="card-header">Submissions per Exam</div>
            <div className="card-body">
              <BarChart data={data.chart} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">Recent Submissions</div>
            {data.recentResults.length === 0 ? (
              <div className="empty">No submissions yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentResults.map((r) => (
                      <tr key={r.id}>
                        <td>{r.studentName}</td>
                        <td>{r.examTitle}</td>
                        <td>
                          {r.scoreAchieved} / {r.totalMarks}
                        </td>
                        <td>{fmtDate(r.submissionTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="row mt">
            <Link href="/admin/exams/new" className="btn btn-primary">
              + Add Exam
            </Link>
            <Link href="/admin/exams" className="btn btn-outline">
              Manage Exams
            </Link>
          </div>
        </>
      )}
    </>
  );
}
