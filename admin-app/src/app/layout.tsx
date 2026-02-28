import type { Metadata } from 'next';
import { vazirmatn } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'کیدتیوب — مدیریت',
  description: 'پنل مدیریت کیدتیوب',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans antialiased">
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-xl font-bold">پنل مدیریت کیدتیوب</h1>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
