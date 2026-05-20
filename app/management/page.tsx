"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  signInManagement,
  type ManagementSignInResult,
} from "@/app/actions/management-auth";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

export default function ManagementLoginPage() {
  const router = useRouter();
  const { locale } = useDemo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"invalid" | "not_configured" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signInManagement(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/management/rooms");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="Empire Apartments" width={64} height={64} className="rounded-xl" />
            <h1 className="mt-5 text-2xl font-black uppercase tracking-wider text-[var(--gold)]">
              {t(locale, "mgmtLoginTitle")}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t(locale, "mgmtLoginSub")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--gold-light)]">
                {t(locale, "mgmtEmail")}
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl bg-[var(--surface)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none ring-1 ring-[var(--border-light)] transition placeholder:text-[var(--muted)] focus:ring-[var(--gold)]/40"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--gold-light)]">
                {t(locale, "mgmtPassword")}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl bg-[var(--surface)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none ring-1 ring-[var(--border-light)] transition placeholder:text-[var(--muted)] focus:ring-[var(--gold)]/40"
              />
            </div>
            {error === "invalid" && (
              <p className="text-center text-sm font-semibold text-red-500" role="alert">
                {t(locale, "mgmtLoginInvalid")}
              </p>
            )}
            {error === "not_configured" && (
              <p className="text-center text-sm font-semibold text-amber-500" role="alert">
                {t(locale, "mgmtLoginNotConfigured")}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? t(locale, "mgmtSigningIn") : t(locale, "mgmtSignIn")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
