"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MarkingScheme, PassBadge, State } from "@/components/ui";
import { ReviewQuestion, StudentResult } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useFetch<{ result: StudentResult; questions: ReviewQuestion[] }>(`/student/results/${id}`);

  return (
    <>
      <State loading={loading} error={error} />
      {data && (
        <>
          <div className="row between mb">
            <div>
              <h2 style={{ margin: 0 }}>Review: {data.result.examTitle}</h2>
              <div className="muted">
                Score {data.result.scoreAchieved} / {data.result.totalMarks} ({data.result.percentage.toFixed(1)}%) <PassBadge passed={data.result.passed} />
              </div>
              <div className="small">
                <MarkingScheme correct={data.result.correctMarks} negative={data.result.negativeMarks} />
              </div>
            </div>
            <Link href="/student/dashboard" className="btn btn-outline">
              ← Dashboard
            </Link>
          </div>

          {data.questions.map((q, idx) => {
            const unanswered = q.selectedOption === 0;
            const correct = q.selectedOption === q.correctAnswer;
            const awarded = unanswered ? 0 : correct ? data.result.correctMarks : -data.result.negativeMarks;
            return (
              <div className="card mb" key={q.id}>
                <div className="card-header row between">
                  <span>
                    Question {idx + 1}{" "}
                    <span className={correct ? "text-success" : unanswered ? "muted" : "text-danger"}>({awarded > 0 ? "+" : awarded < 0 ? "−" : ""}{Math.abs(awarded)} marks)</span>
                  </span>
                  <span className={`badge ${correct ? "badge-success" : unanswered ? "badge-muted" : "badge-danger"}`}>
                    {correct ? "Correct" : unanswered ? "Unanswered" : "Incorrect"}
                  </span>
                </div>
                <div className="card-body">
                  <p style={{ fontWeight: 500 }}>{q.text}</p>
                  {q.options.map((opt, i) => {
                    const n = i + 1;
                    const isCorrect = n === q.correctAnswer;
                    const isMine = n === q.selectedOption;
                    const cls = isCorrect ? "correct" : isMine ? "wrong" : "";
                    return (
                      <div key={n} className={`option noclick ${cls}`}>
                        <span>
                          {opt}
                          {isCorrect && <strong className="text-success"> ✓ Correct answer</strong>}
                          {isMine && !isCorrect && <strong className="text-danger"> ✗ Your answer</strong>}
                          {isMine && isCorrect && <strong className="text-success"> (Your answer)</strong>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
