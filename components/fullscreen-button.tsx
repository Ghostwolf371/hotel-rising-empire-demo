"use client";

import { useCallback, useSyncExternalStore } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const fullscreenElement = (): Element | null => {
  const d = document as FullscreenDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
};

const isInstalledPwa = (): boolean =>
  window.matchMedia("(display-mode: fullscreen)").matches ||
  window.matchMedia("(display-mode: standalone)").matches;

const fullscreenApiSupported = (): boolean => {
  const el = document.documentElement as FullscreenElement;
  return (
    typeof el.requestFullscreen === "function" ||
    typeof el.webkitRequestFullscreen === "function"
  );
};

/**
 * Snapshot for `useSyncExternalStore`. Returning a single tuple keeps the
 * hook's Object.is equality check happy across re-renders.
 */
type Snapshot = {
  supported: boolean;
  active: boolean;
  installedPwa: boolean;
};

const SERVER_SNAPSHOT: Snapshot = Object.freeze({
  supported: false,
  active: false,
  installedPwa: false,
});

let cached: Snapshot | null = null;

const getSnapshot = (): Snapshot => {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  const next: Snapshot = {
    supported: fullscreenApiSupported(),
    active: fullscreenElement() !== null,
    installedPwa: isInstalledPwa(),
  };
  if (
    cached &&
    cached.supported === next.supported &&
    cached.active === next.active &&
    cached.installedPwa === next.installedPwa
  ) {
    return cached;
  }
  cached = next;
  return cached;
};

const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

const subscribe = (notify: () => void): (() => void) => {
  const invalidate = () => {
    cached = null;
    notify();
  };
  document.addEventListener("fullscreenchange", invalidate);
  document.addEventListener("webkitfullscreenchange", invalidate);
  const mqlFs = window.matchMedia("(display-mode: fullscreen)");
  const mqlSa = window.matchMedia("(display-mode: standalone)");
  mqlFs.addEventListener?.("change", invalidate);
  mqlSa.addEventListener?.("change", invalidate);
  return () => {
    document.removeEventListener("fullscreenchange", invalidate);
    document.removeEventListener("webkitfullscreenchange", invalidate);
    mqlFs.removeEventListener?.("change", invalidate);
    mqlSa.removeEventListener?.("change", invalidate);
  };
};

const requestEnter = async (): Promise<void> => {
  const el = document.documentElement as FullscreenElement;
  const req = el.requestFullscreen ?? el.webkitRequestFullscreen;
  if (typeof req !== "function") return;
  await Promise.resolve(req.call(el));
};

const requestExit = async (): Promise<void> => {
  const d = document as FullscreenDocument;
  const exit = d.exitFullscreen ?? d.webkitExitFullscreen;
  if (typeof exit !== "function") return;
  await Promise.resolve(exit.call(d));
};

/**
 * Header toggle for true browser fullscreen. Hidden when the app is already
 * an installed PWA (which gets fullscreen for free via the manifest) or when
 * the platform doesn't expose the Fullscreen API at all.
 *
 * Replaces the previous auto-fullscreen-on-first-tap behaviour because
 * (a) it surprised users on desktop and (b) the gesture was easy to spend
 * accidentally on a stray tap that didn't actually need fullscreen.
 */
export function FullscreenButton({
  className = "",
  labelEnter = "Fullscreen",
  labelExit = "Exit fullscreen",
}: {
  className?: string;
  labelEnter?: string;
  labelExit?: string;
}) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const onClick = useCallback(async () => {
    try {
      if (fullscreenElement() !== null) {
        await requestExit();
      } else {
        await requestEnter();
      }
    } catch {
      // The browser can reject the request (e.g. it wasn't called from a
      // user gesture, or the embedding frame disallows fullscreen). Swallow
      // so we don't surface a console exception on the guest tablet.
    }
  }, []);

  if (!snap.supported || snap.installedPwa) return null;

  const label = snap.active ? labelExit : labelEnter;
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={snap.active}
      className={`flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--gold)]/30 hover:text-[var(--gold)] ${className}`}
    >
      {snap.active ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5a1 1 0 00-1-1H4m16 0h-4a1 1 0 00-1 1v4m0 6v4a1 1 0 001 1h4M4 20h4a1 1 0 001-1v-4" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V5a1 1 0 011-1h3m8 0h3a1 1 0 011 1v3m0 8v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" />
        </svg>
      )}
    </button>
  );
}
