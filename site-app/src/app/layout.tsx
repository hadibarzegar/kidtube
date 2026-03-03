import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
import TopBar from '@/components/TopBar';
import BottomTabBar from '@/components/BottomTabBar';
import { SidebarProvider } from '@/components/SidebarContext';
import LayoutShell from '@/components/LayoutShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'کیدتیوب',
  description: 'ویدیوهای آموزشی فارسی برای کودکان',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[var(--color-bg)]">
        <SidebarProvider>
          <div className="min-h-screen">
            <TopBar />
            <LayoutShell>
              {children}
            </LayoutShell>
            <BottomTabBar />
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
