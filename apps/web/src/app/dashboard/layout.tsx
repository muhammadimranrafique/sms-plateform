import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'viewer';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">School Management System</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-navy-900">{user.email}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase">{role}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
