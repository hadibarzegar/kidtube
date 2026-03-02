import localFont from 'next/font/local';
import { Fredoka, Nunito } from 'next/font/google';

export const vazirmatn = localFont({
  src: [
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/vazirmatn/fonts/webfonts/Vazirmatn-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-fredoka',
});

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-nunito',
});
