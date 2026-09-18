"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const clientMemoryCache = new Map<string, string>();
const inFlightPromises = new Map<string, Promise<string>>();

interface Props {
  text: string;
  as?: "span" | "h2" | "h3" | "h4" | "p" | "div";
  className?: string;
  isDescription?: boolean;
}

export function TranslatedEventText({
  text,
  as: Component = "span",
  className = "",
  isDescription = false,
}: Props) {
  const { locale } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (locale === "es" || !text || !text.trim()) {
      setTranslated(text);
      return;
    }

    const cacheKey = `${locale}:${text.trim()}`;
    if (clientMemoryCache.has(cacheKey)) {
      setTranslated(clientMemoryCache.get(cacheKey)!);
      return;
    }

    let isCancelled = false;

    async function fetchTranslation() {
      try {
        let fetchPromise = inFlightPromises.get(cacheKey);

        if (!fetchPromise) {
          const payload = isDescription
            ? { description: text, targetLang: locale }
            : { title: text, targetLang: locale };

          fetchPromise = fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
            .then(async (res) => {
              if (!res.ok) return text;
              const data = await res.json();
              const result = isDescription
                ? data.description || text
                : data.title || text;
              clientMemoryCache.set(cacheKey, result);
              return result;
            })
            .catch(() => text)
            .finally(() => {
              inFlightPromises.delete(cacheKey);
            });

          inFlightPromises.set(cacheKey, fetchPromise);
        }

        const result = await fetchPromise;
        if (!isCancelled) {
          setTranslated(result);
        }
      } catch (err) {
        // Fallback al original silencioso
      }
    }

    fetchTranslation();

    return () => {
      isCancelled = true;
    };
  }, [locale, text, isDescription]);

  return <Component className={className}>{translated}</Component>;
}
