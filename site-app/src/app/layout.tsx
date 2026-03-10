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
      <head />
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
