"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { homeFor, useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";

/** Client-side route guard (mirrors the /admin/** and /student/** rules in SecurityConfig.java).
 *  The real enforcement is on the API; this only decides what to render. */
export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homeFor(user));
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) return <p className="muted center mt">Loading…</p>;
  return <>{children}</>;
}
