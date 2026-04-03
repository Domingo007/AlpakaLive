interface DisclaimerBannerProps {
  variant?: 'chat' | 'data' | 'imaging' | 'supplement';
}

export function DisclaimerBanner({ variant = 'chat' }: DisclaimerBannerProps) {
  if (variant === 'chat') {
    return (
      <div className="px-3 py-1.5 bg-[#fef3e2] border-t border-[#f0d8a8] text-[10px] text-[#8a6d3b] text-center shrink-0">
        * AlpakaLive analizuje dane dostarczone przez użytkownika. Nie stanowi porady medycznej. Konsultuj decyzje z lekarzem.
      </div>
    );
  }

  if (variant === 'data') {
    return (
      <div className="bg-bg-primary rounded-lg border-l-[3px] border-[#f0c040] px-3 py-2 text-[11px] text-text-secondary mb-3">
        * Wykresy i trendy opierają się na danych wprowadzonych przez użytkownika.
        Wartości referencyjne pochodzą z opublikowanej literatury.
        Interpretacja wyników powinna odbywać się w konsultacji z lekarzem.
      </div>
    );
  }

  if (variant === 'imaging') {
    return (
      <div className="bg-[#fde8e8] rounded-lg border-l-[3px] border-alert-critical px-3 py-2.5 text-xs text-[#8b2020] mb-3">
        ⚠️ Analiza obrazowania ma charakter WYŁĄCZNIE informacyjny i NIE stanowi opisu radiologicznego.
        Wynik MUSI być zweryfikowany przez radiologa i lekarza onkologa.
        Nie podejmuj decyzji zdrowotnych na podstawie tej analizy.
      </div>
    );
  }

  if (variant === 'supplement') {
    return (
      <div className="bg-[#fef3e2] rounded-lg border-l-[3px] border-[#f0a030] px-3 py-2 text-[11px] text-[#8a6d3b] mb-3">
        * Poniższe informacje pochodzą z opublikowanych badań naukowych i NIE stanowią rekomendacji.
        Przed zastosowaniem skonsultuj z lekarzem prowadzącym.
      </div>
    );
  }

  return null;
}
