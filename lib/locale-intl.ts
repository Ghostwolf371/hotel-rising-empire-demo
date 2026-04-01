import type { Locale } from "./types";

/** BCP 47 tags for `Intl` date/time formatting per app locale */
const BCP47: Record<Locale, string> = {
  en: "en-US",
  nl: "nl-NL",
  es: "es-419",
  pt: "pt-BR",
};

export function bcp47ForLocale(locale: Locale): string {
  return BCP47[locale];
}
