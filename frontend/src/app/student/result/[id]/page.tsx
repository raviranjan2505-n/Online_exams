"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MarkingScheme, State } from "@/components/ui";
import { ReviewQuestion, StudentResult } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useFetch<{ result: StudentResult; questions: ReviewQuestion[] }>(`/student/results/${id}`);

  return (
    <div className="narrow" style={{ maxWidth: 720, margin: "0 auto" }}>
      <State loading={loading} error={error} />
      {data && (
        <div className="card center">
          <div className="card-body" style={{ padding: 40 }}>
            <div style={{ fontSize: "4rem", lineHeight: 1 }}>{data.result.passed ? "🏆" : "⚠️"}</div>
            <h1 className="mt-s">{data.result.passed ? "Congratulations, You Passed!" : "Better Luck Next Time"}</h1>
            <p className="muted">
              You have successfully submitted <strong>{data.result.examTitle}</strong>.
            </p>
            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "24px 0" }} />
            <div className="muted">Your Score</div>
            <div style={{ fontSize: "3.4rem", fontWeight: 700 }} className={data.result.passed ? "text-success" : "text-danger"}>
              {data.result.percentage.toFixed(1)}%
            </div>
            <div className="muted mb">
              {data.result.scoreAchieved} out of {data.result.totalMarks} marks
            </div>
            <div className="small mb">
              <MarkingScheme correct={data.result.correctMarks} negative={data.result.negativeMarks} />
            </div>
            <div className="grid grid-3 mb" style={{ textAlign: "center" }}>
              <div>
                <div className="text-success" style={{ fontWeight: 700, fontSize: "1.4rem" }}>
                  {data.result.correctCount}
                </div>
                <div className="small muted">Correct (+{data.result.correctCount * data.result.correctMarks})</div>
              </div>
              <div>
                <div className="text-danger" style={{ fontWeight: 700, fontSize: "1.4rem" }}>
                  {data.result.incorrectCount}
                </div>
                <div className="small muted">Wrong (−{data.result.incorrectCount * data.result.negativeMarks})</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>{data.result.unattemptedCount}</div>
                <div className="small muted">Unattempted (0)</div>
              </div>
            </div>
            <div className="progress">
              <div style={{ width: `${data.result.percentage}%`, background: data.result.passed ? "var(--success)" : "var(--danger)" }}>
                {Math.round(data.result.percentage)}%
              </div>
            </div>
            <div className="row mt" style={{ justifyContent: "center" }}>
              <Link href={`/student/review/${data.result.id}`} className="btn btn-primary">
                Review Answers
              </Link>
              <Link href="/student/dashboard" className="btn btn-outline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
