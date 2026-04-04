interface DisclaimerBannerProps {
  variant?: 'chat' | 'data' | 'imaging' | 'supplement';
}

export function DisclaimerBanner({ variant = 'chat' }: DisclaimerBannerProps) {
  if (variant === 'chat') {
    return (
      <div className="px-4 py-1.5 bg-lavender-50 border-t border-lavender-100 text-[10px] text-text-tertiary text-center tracking-wide shrink-0">
        * AlpacaLive analizuje dane dostarczone przez użytkownika. Nie stanowi porady medycznej. Konsultuj decyzje z lekarzem.
      </div>
    );
  }

  if (variant === 'data') {
    return (
      <div className="rounded-xl border-l-[3px] border-alert-warning bg-[#fffbeb] px-3 py-2 text-[11px] text-[#92400e] mb-3">
        * Wykresy opierają się na danych użytkownika. Wartości referencyjne z opublikowanej literatury. Interpretacja z lekarzem.
      </div>
    );
  }

  if (variant === 'imaging') {
    return (
      <div className="rounded-xl border-l-[3px] border-alert-critical bg-[#fef2f2] px-3 py-2.5 text-xs text-[#991b1b] mb-3">
        ⚠️ Analiza obrazowania ma charakter WYŁĄCZNIE informacyjny i NIE stanowi opisu radiologicznego. Wynik MUSI być zweryfikowany przez radiologa i onkologa.
      </div>
    );
  }

  if (variant === 'supplement') {
    return (
      <div className="rounded-xl border-l-[3px] border-lavender-500 bg-lavender-50 px-3 py-2 text-[11px] text-lavender-800 mb-3">
        * Informacje z opublikowanych badań naukowych. NIE stanowią rekomendacji. Konsultuj z lekarzem.
      </div>
    );
  }

  return null;
}
