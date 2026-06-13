import Link from 'next/link';
import { BookOpen, LayoutList, Users, GitCompareArrows, PercentCircle } from 'lucide-react';

const reports = [
  { href: '/dashboard/reports/student-ledger', title: 'Student Fee Ledger', desc: 'Complete fee history per student', icon: BookOpen },
  { href: '/dashboard/reports/class-collection', title: 'Class Collection Summary', desc: 'Collection rates by class', icon: LayoutList },
  { href: '/dashboard/reports/defaulters', title: 'Defaulter List', desc: 'Overdue students with aging analysis', icon: Users },
  { href: '/dashboard/reports/comparative', title: 'Comparative Report', desc: 'Cross-term/year comparison', icon: GitCompareArrows },
  { href: '/dashboard/reports/concessions', title: 'Concessions Report', desc: 'Scholarships & discounts summary', icon: PercentCircle },
];

const iconColors = ['text-blue-600 bg-blue-50', 'text-emerald-600 bg-emerald-50', 'text-amber-600 bg-amber-50', 'text-purple-600 bg-purple-50', 'text-rose-600 bg-rose-50'];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Reports</h1>
        <p className="text-sm text-slate-500">Accountant-grade financial reports and analysis.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(({ href, title, desc, icon: Icon }, i) => (
          <Link key={href} href={href as any} className="card group flex items-start gap-4 p-5 transition hover:shadow-md">
            <div className={`rounded-lg p-3 ${iconColors[i]}`}>
              <Icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-navy-900 group-hover:text-blue-700">{title}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
