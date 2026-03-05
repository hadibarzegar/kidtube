import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
import { TooltipProvider } from '@/components/ui/tooltip';
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
        <TooltipProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
