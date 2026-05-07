"use client";

import { forwardRef, type ReactNode, type Ref } from "react";
import {
  GUEST_MENU_FLOW_HEADER_SHEET,
  GUEST_MENU_STICKY_PAD_SAFE_TOP,
} from "@/lib/guest-toolbar-styles";

/** Same insets and row as menu bar; no opaque background (gradient visible). */
export const guestFlowHeaderClassName =
  `relative z-20 ${GUEST_MENU_FLOW_HEADER_SHEET} ${GUEST_MENU_STICKY_PAD_SAFE_TOP}`;

/** Same footprint as menu cart / theme controls */
export const guestFlowThemeButtonClassName =
  "flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--gold)]/30 hover:text-[var(--gold)]";

export type GuestFlowHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const GuestFlowHeader = forwardRef<HTMLElement, GuestFlowHeaderProps>(
  function GuestFlowHeader({ children, className }, ref: Ref<HTMLElement>) {
    return (
      <header
        ref={ref}
        className={className ? `${guestFlowHeaderClassName} ${className}` : guestFlowHeaderClassName}
      >
        {children}
      </header>
    );
  },
);
