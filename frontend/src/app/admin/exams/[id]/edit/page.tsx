"use client";

import { useParams, useRouter } from "next/navigation";
import ExamForm from "@/components/ExamForm";
import { State } from "@/components/ui";
import { api } from "@/lib/api";
import { Exam } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

export default function EditExam() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error } = useFetch<{ exam: Exam }>(`/admin/exams/${id}`);

  return (
    <div className="narrow">
      <h2>Edit Exam</h2>
      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          <div className="card-body">
            <ExamForm
              initial={data.exam}
              submitLabel="Save Changes"
              onSubmit={async (v) => {
                await api(`/admin/exams/${id}`, { method: "PUT", body: v });
                router.push("/admin/exams");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
