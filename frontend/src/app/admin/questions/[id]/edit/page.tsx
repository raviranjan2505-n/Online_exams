"use client";

import { useParams, useRouter } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";
import { State } from "@/components/ui";
import { api } from "@/lib/api";
import { Question } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

export default function EditQuestion() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error } = useFetch<{ question: Question }>(`/admin/questions/${id}`);

  return (
    <div className="narrow">
      <h2>Edit Question</h2>
      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          <div className="card-body">
            <QuestionForm
              initial={data.question}
              submitLabel="Save Changes"
              onSubmit={async (v) => {
                await api(`/admin/questions/${id}`, { method: "PUT", body: v });
                router.push(`/admin/exams/${data.question.examId}/questions`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
