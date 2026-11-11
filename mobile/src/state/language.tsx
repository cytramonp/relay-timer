import React, { createContext, useContext, type ReactNode } from "react";
import {
  readLanguage,
  translator,
  type Language,
  type Translate,
} from "../core/language";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import pt from "../locales/pt.json";
import { useApp } from "./app-store";

const translations: Record<Language, Translate> = {
  en: translator({}),
  es: translator(es),
  fr: translator(fr),
  de: translator(de),
  pt: translator(pt),
};

const TranslationContext = createContext(translations.en);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { store } = useApp();
  return (
    <TranslationContext.Provider
      value={translations[readLanguage(store.settings.language)]}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslate() {
  return useContext(TranslationContext);
}
