"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert } from "@/components/ui";
import { homeFor, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(username, password);
      router.push(homeFor(u));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="container narrow page">
      <div className="card">
        <div className="card-header center">Login</div>
        <div className="card-body">
          <Alert>{error}</Alert>
          <form onSubmit={submit}>
            <div className="field">
              <label>Username / Email</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Signing in…" : "Login"}
            </button>
          </form>
          <p className="center mt-s small">
            New student? <Link href="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
