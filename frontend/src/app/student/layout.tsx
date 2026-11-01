import { ReactNode } from "react";
import RequireRole from "@/components/RequireRole";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="STUDENT">
      <div className="container page">{children}</div>
    </RequireRole>
  );
}
