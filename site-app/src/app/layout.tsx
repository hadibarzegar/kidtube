import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
import TopNavbar from '@/components/TopNavbar';
import BottomTabBar from '@/components/BottomTabBar';
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
      <body className="font-sans antialiased bg-white">
        <div className="min-h-screen">
          <TopNavbar />
          <main className="pb-20 md:pb-0">
            {children}
          </main>
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
