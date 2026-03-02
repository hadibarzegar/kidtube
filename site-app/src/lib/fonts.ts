import localFont from 'next/font/local';

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
