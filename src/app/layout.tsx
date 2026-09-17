import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'TaskFlow | ระบบติดตามและตรวจรับงาน',
  description: 'ระบบติดตามและตรวจรับงานซอฟต์แวร์',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23EB0A1E"/><path d="M28 52 L42 66 L74 34" fill="none" stroke="%23FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0B0F17" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
