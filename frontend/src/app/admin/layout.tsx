import { ReactNode } from "react";
import RequireRole from "@/components/RequireRole";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <div className="container page">{children}</div>
    </RequireRole>
  );
}
