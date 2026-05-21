import type { Locale } from "./types";
import enJson from "./i18n/locales/en.json";
import esJson from "./i18n/locales/es.json";
import frJson from "./i18n/locales/fr.json";
import nlJson from "./i18n/locales/nl.json";
import ptJson from "./i18n/locales/pt.json";

const dict = {
  en: enJson,
  nl: nlJson,
  es: esJson,
  pt: ptJson,
  fr: frJson,
};

export type TKey = keyof typeof enJson;

export function t(locale: Locale, key: TKey): string {
  return dict[locale][key];
}
