"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./ui";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/exams", label: "Manage Exams" },
  { href: "/admin/students", label: "Manage Students" },
];
const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/results", label: "My Results" },
  { href: "/student/profile", label: "Profile" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();

  // The Java exam page had no navbar (focus mode). Keep that.
  if (path.startsWith("/student/exam/")) return null;

  const links = user?.role === "ADMIN" ? adminLinks : user?.role === "STUDENT" ? studentLinks : [];

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="brand">
          Online Exam
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={path.startsWith(l.href) ? "active" : ""}>
            {l.label}
          </Link>
        ))}
        <span className="spacer" />
        {user ? (
          <>
            <span className="user">
              <Avatar url={user.profilePicUrl} name={user.fullName || user.username} size={30} />
              {user.fullName || user.username}
            </span>
            <button className="btn btn-sm btn-outline" style={{ color: "#fff", borderColor: "#6c757d" }} onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
