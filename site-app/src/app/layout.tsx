import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
import TopBar from '@/components/TopBar';
import BottomTabBar from '@/components/BottomTabBar';
import OnboardingTour from '@/components/OnboardingTour';
import { SidebarProvider } from '@/components/SidebarContext';
import LayoutShell from '@/components/LayoutShell';
import ThemeProvider from '@/components/ThemeProvider';
import SoundProvider from '@/components/SoundProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'KidTube',
  description: 'ویدیوهای آموزشی فارسی برای کودکان',
  icons: {
    icon: '/logo-icon.svg',
  },
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
        <ThemeProvider>
          <SoundProvider>
            <SidebarProvider>
              <div className="min-h-screen">
                <TopBar />
                <LayoutShell>
                  {children}
                </LayoutShell>
                <BottomTabBar />
                <OnboardingTour />
              </div>
            </SidebarProvider>
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
