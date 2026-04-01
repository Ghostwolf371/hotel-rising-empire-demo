import type { Locale } from "./types";
import enJson from "./i18n/locales/en.json";
import esJson from "./i18n/locales/es.json";
import nlJson from "./i18n/locales/nl.json";
import ptJson from "./i18n/locales/pt.json";

const dict = {
  en: enJson,
  nl: nlJson,
  es: esJson,
  pt: ptJson,
};

export type TKey = keyof typeof enJson;

export function t(locale: Locale, key: TKey): string {
  return dict[locale][key];
}
