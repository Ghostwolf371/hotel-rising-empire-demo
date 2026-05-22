"use client";

import { useCallback, useEffect, useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import {
  addManagementUser,
  fetchManagementUsers,
  saveManagementUser,
  type ManagementUserPublic,
} from "@/app/actions/management-users";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

type UserForm = {
  email: string;
  displayName: string;
  password: string;
  active: boolean;
};

const emptyForm: UserForm = {
  email: "",
  displayName: "",
  password: "",
  active: true,
};

export default function ManagementUsersPage() {
  const { locale } = useDemo();
  const [users, setUsers] = useState<ManagementUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ManagementUserPublic | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchManagementUsers();
      setUsers(rows);
    } catch {
      setError(t(locale, "mgmtUsersLoadError"));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchManagementUsers();
        if (!cancelled) setUsers(rows);
      } catch {
        if (!cancelled) setError(t(locale, "mgmtUsersLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function openNew() {
    setEditing(null);
    setIsNew(true);
    setForm(emptyForm);
  }

  function openEdit(user: ManagementUserPublic) {
    setEditing(user);
    setIsNew(false);
    setForm({
      email: user.email,
      displayName: user.displayName ?? "",
      password: "",
      active: user.active,
    });
  }

  function closeModal() {
    setEditing(null);
    setIsNew(false);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const res = await addManagementUser({
          email: form.email,
          password: form.password,
          displayName: form.displayName || undefined,
        });
        if (!res.ok) {
          setError(
            res.error === "duplicate_email"
              ? t(locale, "mgmtUsersDuplicateEmail")
              : t(locale, "mgmtUsersSaveError"),
          );
          return;
        }
      } else if (editing) {
        const res = await saveManagementUser({
          id: editing.id,
          email: form.email,
          displayName: form.displayName,
          active: form.active,
          password: form.password || undefined,
        });
        if (!res.ok) {
          setError(
            res.error === "duplicate_email"
              ? t(locale, "mgmtUsersDuplicateEmail")
              : t(locale, "mgmtUsersSaveError"),
          );
          return;
        }
      }
      closeModal();
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--gold)]">{t(locale, "mgmtUsersTitle")}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{t(locale, "mgmtUsersSub")}</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
          >
            {t(locale, "mgmtUsersAdd")}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]/80">
                <th className="px-6 py-3 font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColEmail")}</th>
                <th className="px-6 py-3 font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColName")}</th>
                <th className="px-6 py-3 font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColStatus")}</th>
                <th className="px-6 py-3 text-right font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[var(--muted)]">
                    {t(locale, "mgmtUsersLoading")}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[var(--muted)]">
                    {t(locale, "mgmtUsersEmpty")}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border)] last:border-0 odd:bg-[var(--background)]/40">
                    <td className="px-6 py-4 font-semibold text-[var(--foreground)]">{user.email}</td>
                    <td className="px-6 py-4 text-[var(--muted)]">{user.displayName || "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          user.active
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        }`}
                      >
                        {user.active ? t(locale, "mgmtUsersActive") : t(locale, "mgmtUsersInactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="text-sm font-semibold text-[var(--gold)] transition hover:text-[var(--gold-light)]"
                      >
                        {t(locale, "mgmtUsersEdit")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isNew || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-6 py-12 backdrop-blur-sm"
          onClick={closeModal}
        >
          <form
            className="animate-fade-in-scale w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h2 className="text-xl font-black text-[var(--gold)]">
              {isNew ? t(locale, "mgmtUsersAdd") : t(locale, "mgmtUsersEdit")}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  {t(locale, "mgmtUsersColEmail")}
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  {t(locale, "mgmtUsersColName")}
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  {isNew ? t(locale, "mgmtUsersPassword") : t(locale, "mgmtUsersPasswordOptional")}
                </label>
                <input
                  type="password"
                  required={isNew}
                  minLength={isNew ? 8 : undefined}
                  autoComplete={isNew ? "new-password" : "new-password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--gold)]"
                />
              </div>
              {!isNew && (
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="h-4 w-4 rounded border-[var(--border)]"
                  />
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {t(locale, "mgmtUsersActive")}
                  </span>
                </label>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-[var(--border-light)] py-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                {t(locale, "confirmEndCancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-[var(--gold)] py-3 text-sm font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] disabled:opacity-50"
              >
                {saving ? "…" : t(locale, "mgmtUsersSave")}
              </button>
            </div>
          </form>
        </div>
      )}
    </ManagementShell>
  );
}
