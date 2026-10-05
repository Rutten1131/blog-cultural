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
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-3">
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
                  ? "bg-purple-100 text-purple-800 font-bold border border-purple-200 shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-purple-50"
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
        className="inline-flex h-8 sm:h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 sm:px-3 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
      >
        <span className="text-sm leading-none">{currentLocale.flag}</span>
        <span className="uppercase text-[11px] font-bold tracking-wider">
          {currentLocale.code}
        </span>
        <svg
          className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
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
        <div className="absolute right-0 top-full mt-2 w-44 origin-top-right rounded-2xl border border-slate-200/90 bg-white/98 p-1.5 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.18)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-2.5 py-1">
            Seleccionar idioma
          </div>
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                locale === l.code
                  ? "bg-purple-100 text-purple-800 font-bold"
                  : "text-slate-700 hover:bg-purple-50 hover:text-purple-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{l.flag}</span>
                <span>{l.nativeName}</span>
              </div>
              {locale === l.code && (
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
