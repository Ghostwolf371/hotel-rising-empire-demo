"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GuestSessionExpiryUiContextValue = {
  sessionExpiredOpen: boolean;
  openSessionExpiredModal: () => void;
  closeSessionExpiredModal: () => void;
};

const GuestSessionExpiryUiContext =
  createContext<GuestSessionExpiryUiContextValue | null>(null);

export function GuestSessionExpiryUiProvider({ children }: { children: ReactNode }) {
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

  const openSessionExpiredModal = useCallback(() => {
    setSessionExpiredOpen(true);
  }, []);

  const closeSessionExpiredModal = useCallback(() => {
    setSessionExpiredOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      sessionExpiredOpen,
      openSessionExpiredModal,
      closeSessionExpiredModal,
    }),
    [sessionExpiredOpen, openSessionExpiredModal, closeSessionExpiredModal],
  );

  return (
    <GuestSessionExpiryUiContext.Provider value={value}>
      {children}
    </GuestSessionExpiryUiContext.Provider>
  );
}

export function useGuestSessionExpiryUi() {
  const ctx = useContext(GuestSessionExpiryUiContext);
  if (!ctx) {
    throw new Error(
      "useGuestSessionExpiryUi must be used within GuestSessionExpiryUiProvider",
    );
  }
  return ctx;
}
