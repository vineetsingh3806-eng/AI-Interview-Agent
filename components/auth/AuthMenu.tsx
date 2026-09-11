"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function AuthMenu() {
  const router = useRouter();
  const { ready, user, logout } = useAuth();

  if (!ready) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Log in</Button>
        </Link>
        <Link href="/signup">
          <Button variant="brand" size="sm" className="rounded-xl">Create account</Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout().finally(() => router.push("/login"));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
        <UserRound size={13} className="text-indigo-300" />
        <span className="max-w-36 truncate text-xs text-slate-300">{user.email}</span>
        {user.demo && (
          <span className="rounded-full border border-indigo-400/15 bg-indigo-400/[0.06] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-indigo-200">
            Demo
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="gap-1.5 text-muted-foreground hover:text-white"
        aria-label="Log out of Aria"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}
