import { createClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { StatsGrid } from '@/components/dashboard/StatsGrid';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
  pendingVouchers: number;
}

async function getStats(): Promise<DashboardStats | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  try {
    const res = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}/api/v1/reports/dashboard`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data as DashboardStats;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const stats = await getStats();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your school at a glance.</p>
      </div>
      <StatsGrid stats={stats} />
    </div>
  );
}
