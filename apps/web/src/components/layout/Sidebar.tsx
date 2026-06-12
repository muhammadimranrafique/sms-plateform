'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, GraduationCap, Receipt, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', icon: Users },
  { href: '/dashboard/classes', label: 'Classes', icon: GraduationCap },
  { href: '/dashboard/promotions', label: 'Promotions', icon: ArrowUpDown },
  { href: '/dashboard/vouchers', label: 'Vouchers', icon: Receipt },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-col gap-1 border-r border-slate-100 bg-white p-4">
      <div className="mb-6 px-2 font-display text-lg font-bold text-navy-900">SMS</div>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              active ? 'bg-navy-700 text-white' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
