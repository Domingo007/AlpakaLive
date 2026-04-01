interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatCard({ icon, label, value, subtitle, color }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-3 flex items-center gap-3">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-secondary">{label}</div>
        <div className="text-lg font-semibold" style={color ? { color } : undefined}>{value}</div>
        {subtitle && <div className="text-[10px] text-text-secondary">{subtitle}</div>}
      </div>
    </div>
  );
}
