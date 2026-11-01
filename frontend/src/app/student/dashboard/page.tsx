"use client";

import Link from "next/link";
import { Avatar, BarChart, fmtDate, MarkingScheme, PassBadge, State } from "@/components/ui";
import { ChartPoint, Exam, StudentResult, User } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

interface Dash {
  student: User;
  totalTaken: number;
  averageScore: number;
  highestScore: number;
  chart: ChartPoint[];
  pastResults: StudentResult[];
  availableExams: Exam[];
}

export default function StudentDashboard() {
  const { data, loading, error } = useFetch<Dash>("/student/dashboard");

  return (
    <>
      <State loading={loading} error={error} />
      {data && (
        <>
          <div className="row mb">
            <Avatar url={data.student.profilePicUrl} name={data.student.fullName || data.student.username} size={54} />
            <div>
              <h2 style={{ margin: 0 }}>Welcome back, {data.student.fullName || data.student.username}!</h2>
              <div className="muted">Here is your performance overview.</div>
            </div>
          </div>

          <div className="grid grid-3 mb">
            <div className="card kpi">
              <div className="value text-primary">{data.totalTaken}</div>
              <div className="label">Exams Taken</div>
            </div>
            <div className="card kpi">
              <div className="value text-success">{data.averageScore.toFixed(1)}%</div>
              <div className="label">Average Score</div>
            </div>
            <div className="card kpi">
              <div className="value text-warning">{data.highestScore}%</div>
              <div className="label">Highest Score</div>
            </div>
          </div>

          <div className="card mb">
            <div className="card-header">Score History (%)</div>
            <div className="card-body">
              <BarChart data={data.chart} max={100} suffix="%" />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">Available Exams</div>
              {data.availableExams.length === 0 ? (
                <div className="empty">You&apos;re all caught up! No new exams are available right now.</div>
              ) : (
                data.availableExams.map((e) => (
                  <div key={e.id} className="card-body row between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <strong>{e.title}</strong>
                      <div className="muted small">
                        {e.durationInMinutes} minutes • {e.questionCount} questions • {e.totalMarks} marks
                      </div>
                      <div className="small">
                        <MarkingScheme correct={e.correctMarks} negative={e.negativeMarks} />
                      </div>
                    </div>
                    {e.questionCount ? (
                      <Link href={`/student/exam/${e.id}`} className="btn btn-primary btn-sm">
                        Start Exam
                      </Link>
                    ) : (
                      <span className="muted small">No questions yet</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-header">Your Past Results</div>
              {data.pastResults.length === 0 ? (
                <div className="empty">You haven&apos;t taken any exams yet.</div>
              ) : (
                data.pastResults.map((r) => (
                  <div key={r.id} className="card-body row between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <strong>{r.examTitle}</strong>
                      <div className="muted small">{fmtDate(r.submissionTime)}</div>
                    </div>
                    <div className="row" style={{ gap: 10 }}>
                      <span>
                        {r.scoreAchieved}/{r.totalMarks} <PassBadge passed={r.passed} />
                      </span>
                      <Link href={`/student/review/${r.id}`} className="btn btn-outline btn-sm">
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
