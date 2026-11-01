"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor, useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // logged-in users go straight to their dashboard (like AuthController.home)
  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user));
  }, [user, loading, router]);

  return (
    <div className="container hero">
      <h1>Online Exam System</h1>
      <p>Take timed multiple-choice exams, get instant results and review every answer. Admins can create exams, manage questions and track students.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/login" className="btn btn-primary btn-lg">
          Login
        </Link>
        <Link href="/register" className="btn btn-success btn-lg">
          Create Student Account
        </Link>
      </div>
    </div>
  );
}
