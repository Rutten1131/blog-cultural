"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Locale } from "@/lib/i18n/translations";

export function LanguageSelector({ variant = "default" }: { variant?: "default" | "mobile" }) {
  const { locale, setLocale, locales } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1.5 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] px-3">
          🌐 Idioma / Language
        </span>
        <div className="grid grid-cols-2 gap-1.5 px-2">
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
                locale === l.code
                  ? "bg-[var(--color-purple-1)] text-white shadow-sm"
                  : "bg-white/70 text-[var(--color-dark)] hover:bg-purple-50"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="truncate">{l.nativeName}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Seleccionar idioma"
        aria-expanded={open}
        className="sheen-hover inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--color-dark)] shadow-[var(--shadow-nav)] backdrop-blur-md transition-all duration-200 hover:bg-white hover:border-purple-200"
      >
        <span className="text-sm sm:text-base leading-none">{currentLocale.flag}</span>
        <span className="uppercase text-[11px] sm:text-xs font-bold text-[var(--color-dark)] tracking-wider">
          {currentLocale.code}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-[var(--color-muted)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 origin-top-right rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_16px_40px_-10px_rgba(109,40,217,0.25)] backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] px-2.5 py-1">
            Seleccionar idioma
          </div>
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                locale === l.code
                  ? "bg-purple-100 text-[var(--color-purple-1)] font-bold"
                  : "text-[var(--color-dark)] hover:bg-purple-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{l.flag}</span>
                <span>{l.nativeName}</span>
              </div>
              {locale === l.code && (
                <svg className="h-4 w-4 text-[var(--color-purple-1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
