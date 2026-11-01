"use client";

import { useRouter } from "next/navigation";
import ExamForm from "@/components/ExamForm";
import { api } from "@/lib/api";

export default function NewExam() {
  const router = useRouter();
  return (
    <div className="narrow">
      <h2>Add New Exam</h2>
      <div className="card">
        <div className="card-body">
          <ExamForm
            submitLabel="Create Exam"
            onSubmit={async (v) => {
              await api("/admin/exams", { method: "POST", body: v });
              router.push("/admin/exams");
            }}
          />
        </div>
      </div>
    </div>
  );
}
