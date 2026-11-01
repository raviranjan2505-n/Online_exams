"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Alert } from "@/components/ui";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("username", username);
      fd.append("mobileNumber", mobileNumber);
      fd.append("password", password);
      if (file) fd.append("profilePic", file);
      await api("/auth/register", { method: "POST", body: fd });
      setSuccess(true);
      setFullName("");
      setUsername("");
      setMobileNumber("");
      setPassword("");
      setFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container narrow page">
      <div className="card">
        <div className="card-header center">Create Student Account</div>
        <div className="card-body">
          {success && (
            <Alert kind="success">
              Registration successful! You can now <Link href="/login">login</Link>.
            </Alert>
          )}
          <Alert>{error}</Alert>
          <form onSubmit={submit}>
            <div className="field">
              <label>Full Name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Email (this will be your login)</label>
              <input className="input" type="email" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="field">
              <label>Mobile Number</label>
              <input className="input" type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
            </div>
            <div className="field">
              <label>Profile Picture</label>
              <input className="input" type="file" accept="image/png, image/jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <div className="hint">JPG or PNG, up to 5 MB (optional)</div>
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-success btn-block" disabled={busy}>
              {busy ? "Registering…" : "Register"}
            </button>
          </form>
          <p className="center mt-s small">
            Already have an account? <Link href="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
