import { Users, UserCheck, GraduationCap, Receipt } from 'lucide-react';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
  pendingVouchers: number;
}

const FALLBACK: Stats = {
  totalStudents: 0,
  activeStudents: 0,
  totalClasses: 0,
  pendingVouchers: 0,
};

export function StatsGrid({ stats }: { stats: Stats | null }) {
  const s = stats ?? FALLBACK;
  const cards = [
    { label: 'Total Students', value: s.totalStudents, icon: Users },
    { label: 'Active Students', value: s.activeStudents, icon: UserCheck },
    { label: 'Classes', value: s.totalClasses, icon: GraduationCap },
    { label: 'Pending Vouchers', value: s.pendingVouchers, icon: Receipt },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card flex items-center gap-4">
          <div className="rounded-lg bg-navy-50 p-3 text-navy-700">
            <Icon size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        </div>
      ))}
      {!stats && (
        <p className="col-span-full text-xs text-amber-600">
          Live data unavailable — showing placeholders. Check the API connection.
        </p>
      )}
    </div>
  );
}
