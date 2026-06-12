import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query-provider';
import { publicEnv } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  title: publicEnv.NEXT_PUBLIC_SCHOOL_NAME,
  description: 'School Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
