import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
// Sidebar is rendered inside LayoutShell (conditionally — not shown on login page)
import LayoutShell from '@/components/LayoutShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'KidTube Admin',
  description: 'KidTube Admin Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={vazirmatn.variable}>
      <body className="font-sans antialiased">
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
