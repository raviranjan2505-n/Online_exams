"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import QuestionForm from "@/components/QuestionForm";
import { Alert } from "@/components/ui";
import { api } from "@/lib/api";

export default function AddQuestion() {
  const { id } = useParams<{ id: string }>();
  const [added, setAdded] = useState(0);

  return (
    <div className="narrow">
      <div className="row between">
        <h2>Add Question</h2>
        <Link href={`/admin/exams/${id}/questions`} className="btn btn-outline">
          Done
        </Link>
      </div>
      {added > 0 && <Alert kind="success">Question added successfully! ({added} added this session)</Alert>}
      <div className="card">
        <div className="card-body">
          <QuestionForm
            submitLabel="Add Question"
            resetOnSuccess
            onSubmit={async (v) => {
              await api(`/admin/exams/${id}/questions`, { method: "POST", body: v });
              setAdded((n) => n + 1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
