"use client";

import { useState } from "react";
import { Alert, Avatar, State } from "@/components/ui";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { errMsg, useFetch } from "@/lib/useFetch";

export default function ManageStudents() {
  const { data, loading, error, reload } = useFetch<{ students: User[] }>("/admin/students");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function remove(s: User) {
    if (!confirm(`Delete ${s.fullName || s.username} and ALL their exam results?`)) return;
    setMsg("");
    setErr("");
    try {
      const r = await api<{ message: string }>(`/admin/students/${s.id}`, { method: "DELETE" });
      setMsg(r.message);
      reload();
    } catch (x) {
      setErr(errMsg(x));
    }
  }

  async function reset() {
    if (!resetFor) return;
    setMsg("");
    setErr("");
    try {
      const r = await api<{ message: string }>(`/admin/students/${resetFor.id}/reset-password`, {
        method: "POST",
        body: { newPassword },
      });
      setMsg(r.message);
      setResetFor(null);
      setNewPassword("");
    } catch (x) {
      setErr(errMsg(x));
    }
  }

  return (
    <>
      <h2>Manage Students</h2>
      <Alert kind="success">{msg}</Alert>
      <Alert>{err}</Alert>

      {resetFor && (
        <div className="card mb">
          <div className="card-header">Reset password for {resetFor.fullName || resetFor.username}</div>
          <div className="card-body">
            <div className="row">
              <input
                className="input grow"
                type="text"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
              <button className="btn btn-primary" onClick={reset}>
                Reset Password
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setResetFor(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <State loading={loading} error={error} />
      {data && (
        <div className="card">
          {data.students.length === 0 ? (
            <div className="empty">No students have registered yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Avatar url={s.profilePicUrl} name={s.fullName || s.username} size={36} />
                      </td>
                      <td>{s.fullName || "—"}</td>
                      <td>{s.username}</td>
                      <td>{s.mobileNumber || "—"}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-sm btn-warning" onClick={() => setResetFor(s)}>
                            Reset Password
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
