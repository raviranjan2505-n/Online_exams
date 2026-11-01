"use client";

import { ReactNode } from "react";
import { fileUrl } from "@/lib/api";
import { ChartPoint } from "@/lib/types";

export function Alert({ kind = "danger", children }: { kind?: "success" | "danger" | "info"; children: ReactNode }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

/** Standard loading / error wrapper used by every data page. */
export function State({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <p className="muted center mt">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;
  return null;
}

export function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string; size?: number }) {
  const src = fileUrl(url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name || "Profile"} width={size} height={size} className="avatar" style={{ width: size, height: size }} />;
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {initial}
    </span>
  );
}

/** Tiny dependency-free bar chart (replaces Chart.js from the Thymeleaf pages). */
export function BarChart({ data, max, suffix = "" }: { data: ChartPoint[]; max?: number; suffix?: string }) {
  if (data.length === 0) return <p className="muted center">No data yet.</p>;
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ overflowX: "auto" }}>
      <div className="chart">
        {data.map((d, i) => (
          <div className="col" key={i} title={`${d.label}: ${d.value}${suffix}`}>
            <span className="val">
              {d.value}
              {suffix}
            </span>
            <div className="bar" style={{ height: `${Math.min(100, (d.value / top) * 85)}%` }} />
          </div>
        ))}
      </div>
      <div className="chart-labels">
        {data.map((d, i) => (
          <div key={i} title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** "+4 correct · −1 wrong · 0 unattempted" */
export function MarkingScheme({ correct, negative }: { correct: number; negative: number }) {
  return (
    <span>
      <span className="text-success">+{correct} correct</span> · <span className="text-danger">−{negative} wrong</span> ·{" "}
      <span className="muted">0 unattempted</span>
    </span>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function PassBadge({ passed }: { passed: boolean }) {
  return <span className={`badge ${passed ? "badge-success" : "badge-danger"}`}>{passed ? "PASS" : "FAIL"}</span>;
}
