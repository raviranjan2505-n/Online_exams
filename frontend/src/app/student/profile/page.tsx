"use client";

import { FormEvent, useEffect, useState } from "react";
import { Alert, Avatar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { User } from "@/lib/types";
import { errMsg } from "@/lib/useFetch";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setMobile(user.mobileNumber);
    }
  }, [user]);

  const run = async (fn: () => Promise<string>) => {
    setMsg("");
    setErr("");
    try {
      setMsg(await fn());
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const saveDetails = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await api<{ message: string; user: User }>("/student/profile", {
        method: "PUT",
        body: { fullName, mobileNumber: mobile },
      });
      setUser(r.user);
      return r.message;
    });
  };

  const savePicture = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (!file) throw new Error("Please select a file to upload.");
      const fd = new FormData();
      fd.append("profilePic", file);
      const r = await api<{ message: string; user: User }>("/student/profile/picture", { method: "POST", body: fd });
      setUser(r.user);
      setFile(null);
      (e.target as HTMLFormElement).reset();
      return r.message;
    });
  };

  const savePassword = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await api<{ message: string }>("/student/profile/password", {
        method: "POST",
        body: { oldPassword, newPassword, confirmPassword },
      });
      setOld("");
      setNew("");
      setConfirm("");
      return r.message;
    });
  };

  if (!user) return null;

  return (
    <>
      <h2>My Profile</h2>
      <Alert kind="success">{msg}</Alert>
      <Alert>{err}</Alert>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">Details</div>
          <div className="card-body">
            <div className="row mb">
              <Avatar url={user.profilePicUrl} name={user.fullName || user.username} size={80} />
              <div>
                <strong>{user.fullName || "—"}</strong>
                <div className="muted small">{user.username}</div>
              </div>
            </div>
            <form onSubmit={saveDetails}>
              <div className="field">
                <label>Full Name</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" value={user.username} disabled />
              </div>
              <div className="field">
                <label>Mobile Number</label>
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <button className="btn btn-primary">Save Details</button>
            </form>
          </div>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <div className="card">
            <div className="card-header">Profile Picture</div>
            <div className="card-body">
              <form onSubmit={savePicture}>
                <div className="field">
                  <input className="input" type="file" accept="image/png, image/jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <button className="btn btn-primary">Upload</button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Change Password</div>
            <div className="card-body">
              <form onSubmit={savePassword}>
                <div className="field">
                  <label>Old Password</label>
                  <input className="input" type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required />
                </div>
                <div className="field">
                  <label>New Password</label>
                  <input className="input" type="password" minLength={6} value={newPassword} onChange={(e) => setNew(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <button className="btn btn-primary">Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
