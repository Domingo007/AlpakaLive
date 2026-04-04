import { Icon } from './Icon';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatCard({ icon, label, value, subtitle, color }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-2xl border border-lavender-100 p-4 shadow-[0_4px_12px_rgba(45,31,84,0.08)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center text-lavender-500">
          <Icon name={icon} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-text-secondary font-medium uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-extrabold tracking-tight" style={color ? { color } : { color: '#5e3fa8' }}>
            {value}
          </div>
          {subtitle && <div className="text-[10px] text-text-tertiary">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
