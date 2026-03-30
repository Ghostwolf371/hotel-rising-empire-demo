"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManagementLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@empire.sr");
  const [password, setPassword] = useState("••••••••");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("mgmt-demo", "1");
    router.push("/management/rooms");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="Empire Apartments" width={64} height={64} className="rounded-xl" />
            <h1 className="mt-5 text-2xl font-black uppercase tracking-wider text-[var(--gold)]">
              Management Login
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Empire Apartments Paramaribo — Staff Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--gold-light)]">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[var(--surface)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none ring-1 ring-[var(--border-light)] transition placeholder:text-[var(--muted)] focus:ring-[var(--gold)]/40"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--gold-light)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[var(--surface)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none ring-1 ring-[var(--border-light)] transition placeholder:text-[var(--muted)] focus:ring-[var(--gold)]/40"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
            >
              Sign in
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Demo mode — click Sign in to continue
          </p>
        </div>
      </div>
    </div>
  );
}
