"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addManagementUser,
  fetchManagementUsers,
  removeManagementUser,
  saveManagementUser,
  type ManagementUserPublic,
} from "@/app/actions/management-users";
import { useDemo } from "@/contexts/demo-context";
import { t, type TKey } from "@/lib/i18n";
import {
  ALL_MANAGEMENT_PAGE_KEYS,
  effectivePagesForUser,
  managementPageLabelKey,
  type ManagementPageKey,
} from "@/lib/management-permissions";

type UserForm = {
  email: string;
  displayName: string;
  password: string;
  allowedPages: ManagementPageKey[];
};

const DEFAULT_PAGES: ManagementPageKey[] = ["rooms", "orders"];

const emptyForm: UserForm = {
  email: "",
  displayName: "",
  password: "",
  allowedPages: [...DEFAULT_PAGES],
};

function togglePage(pages: ManagementPageKey[], page: ManagementPageKey): ManagementPageKey[] {
  if (pages.includes(page)) {
    const next = pages.filter((p) => p !== page);
    return next.length > 0 ? next : pages;
  }
  return [...pages, page];
}

export default function ManagementUsersPage() {
  const { locale } = useDemo();
  const [users, setUsers] = useState<ManagementUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ManagementUserPublic | null>(null);
  const [deleting, setDeleting] = useState<ManagementUserPublic | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

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
    setDeleting(null);
    setIsNew(true);
    setForm(emptyForm);
  }

  function openEdit(user: ManagementUserPublic) {
    setEditing(user);
    setDeleting(null);
    setIsNew(false);
    setForm({
      email: user.email,
      displayName: user.displayName ?? "",
      password: "",
      allowedPages: effectivePagesForUser(user.role, user.allowedPages),
    });
  }

  function closeModal() {
    setEditing(null);
    setDeleting(null);
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
          allowedPages: form.allowedPages,
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
          allowedPages: form.allowedPages,
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

  async function handleDelete() {
    if (!deleting) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await removeManagementUser(deleting.id);
      if (!res.ok) {
        const msg =
          res.error === "cannot_delete_self"
            ? t(locale, "mgmtUsersDeleteSelf")
            : res.error === "last_user_manager"
              ? t(locale, "mgmtUsersDeleteLastAdmin")
              : t(locale, "mgmtUsersDeleteError");
        setError(msg);
        return;
      }
      closeModal();
      await load();
    } finally {
      setRemoving(false);
    }
  }

  function pagesSummary(user: ManagementUserPublic): string {
    const pages = effectivePagesForUser(user.role, user.allowedPages);
    return pages.map((p) => t(locale, managementPageLabelKey(p) as TKey)).join(", ");
  }

  return (
    <>
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
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
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]/80">
                <th className="px-6 py-3 font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColEmail")}</th>
                <th className="px-6 py-3 font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColName")}</th>
                <th className="px-6 py-3 font-bold text-[var(--foreground)]">{t(locale, "mgmtUsersColPages")}</th>
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
                    <td className="min-w-[12rem] px-6 py-4 text-xs text-[var(--muted)]">{pagesSummary(user)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          aria-label={t(locale, "mgmtUsersEdit")}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--gold)]"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(user);
                            setEditing(null);
                            setIsNew(false);
                          }}
                          aria-label={t(locale, "mgmtUsersDelete")}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-red-400/10 hover:text-red-400"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
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
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm sm:px-8 sm:py-12"
          onClick={closeModal}
        >
          <form
            className="animate-fade-in-scale w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h2 className="text-xl font-black text-[var(--gold)]">
              {isNew ? t(locale, "mgmtUsersAdd") : t(locale, "mgmtUsersEdit")}
            </h2>
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  {t(locale, "mgmtUsersPagesLabel")}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{t(locale, "mgmtUsersPagesHint")}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ALL_MANAGEMENT_PAGE_KEYS.map((page) => (
                    <label
                      key={page}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={form.allowedPages.includes(page)}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            allowedPages: togglePage(f.allowedPages, page),
                          }))
                        }
                        className="h-4 w-4 shrink-0 rounded border-[var(--border)]"
                      />
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {t(locale, managementPageLabelKey(page) as TKey)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
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

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="animate-fade-in-scale w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-[var(--gold)]">{t(locale, "mgmtUsersDeleteTitle")}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t(locale, "mgmtUsersDeleteConfirm").replace("{email}", deleting.email)}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-[var(--border-light)] py-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                {t(locale, "confirmEndCancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={removing}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-50"
              >
                {removing ? "…" : t(locale, "mgmtUsersDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
