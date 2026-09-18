"use client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function HomeMobileDescubre() {
  const { t } = useLanguage();

  return (
    <div className="mt-4 flex flex-col gap-1 sm:hidden">
      <h2 className="text-sm font-semibold tracking-wide text-brand-300">
        {t("home.mobileDescubre")}
      </h2>
      <p className="text-xs text-white/60">
        {t("home.mobileDescubreSub")}
      </p>
    </div>
  );
}
