"use client";

import { useEffect } from "react";

/**
 * Promote the page to true fullscreen on the first user gesture when the app
 * is running inside a regular browser tab (i.e. *not* an installed PWA).
 *
 * Installed PWAs already get edge-to-edge layout via `display: "fullscreen"`
 * in `app/manifest.ts`, so this is the belt-and-suspenders path for the
 * Android tablet that happens to be on a browser bookmark instead of an
 * installed icon. Browsers require a user gesture to enter fullscreen, so
 * we arm a one-shot listener on `pointerdown` / `touchstart` and only call
 * `requestFullscreen()` once that fires.
 */
export function AutoFullscreen() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const alreadyFullscreen = () =>
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: standalone)").matches ||
      document.fullscreenElement !== null;

    if (alreadyFullscreen()) return;

    let armed = true;

    const tryFullscreen = () => {
      if (!armed || alreadyFullscreen()) {
        armed = false;
        return;
      }
      armed = false;
      const el = document.documentElement;
      const req =
        el.requestFullscreen ??
        // Safari iPad still ships only webkit-prefixed APIs.
        (el as unknown as { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen;
      if (typeof req === "function") {
        // Best-effort; some browsers reject without a recent user gesture.
        // We swallow the rejection so we don't surface a console error to the
        // guest tablet.
        Promise.resolve(req.call(el)).catch(() => undefined);
      }
    };

    const onGesture = () => {
      tryFullscreen();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("keydown", onGesture);
    };

    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("touchstart", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture);

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  return null;
}
