import type { Locale } from "./types";

export type GuestLanguageOption = {
  locale: Locale;
  label: string;
  flag: string;
};

/** Order shown on the guest kiosk language screen (top to bottom). */
export const GUEST_LANGUAGE_OPTIONS: GuestLanguageOption[] = [
  { locale: "en", label: "English", flag: "🇬🇧" },
  { locale: "nl", label: "Nederlands", flag: "🇳🇱" },
  { locale: "es", label: "Español", flag: "🇪🇸" },
  { locale: "pt", label: "Português", flag: "🇵🇹" },
  { locale: "fr", label: "Français", flag: "🇫🇷" },
];
