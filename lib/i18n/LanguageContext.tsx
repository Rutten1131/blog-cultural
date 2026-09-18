"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, LOCALES, UI_TRANSLATIONS } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultText?: string) => string;
  locales: typeof LOCALES;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "es",
  setLocale: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
  locales: LOCALES,
});

const COOKIE_NAME = "NEXT_LOCALE";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    // 1. Intentar leer de localStorage o Cookie
    const saved = localStorage.getItem("agenda_locale") as Locale | null;
    const cookieMatch = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
    const cookieLocale = cookieMatch ? (cookieMatch[2] as Locale) : null;

    const initialLocale = saved || cookieLocale;
    if (initialLocale && LOCALES.some((l) => l.code === initialLocale)) {
      setLocaleState(initialLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("agenda_locale", newLocale);
      document.cookie = `${COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // Ignorar errores de cookies/storage en entornos restringidos
    }
  };

  const t = (key: string, defaultText?: string): string => {
    return UI_TRANSLATIONS[locale]?.[key] || UI_TRANSLATIONS["es"]?.[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, locales: LOCALES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
