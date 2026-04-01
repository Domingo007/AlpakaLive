interface HeaderProps {
  title?: string;
}

export function Header({ title = 'AlpakaLive' }: HeaderProps) {
  return (
    <header className="bg-accent-dark text-accent-warm px-4 py-3 flex items-center justify-between shrink-0">
      <h1 className="font-display text-lg font-bold tracking-wide">{title}</h1>
      <div className="text-xs opacity-70">v1.0</div>
    </header>
  );
}
