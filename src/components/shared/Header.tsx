export function Header() {
  return (
    <header className="bg-bg-card px-4 py-3 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(45,31,84,0.05)] safe-top">
      <div className="flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="AlpacaLive"
          className="w-8 h-8 rounded-lg object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-lg font-bold text-text-primary tracking-tight">AlpacaLive</span>
      </div>
    </header>
  );
}
