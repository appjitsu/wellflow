import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { MonitoringProvider } from '../components/providers/monitoring-provider';
import { QueryProvider } from '../lib/providers/query-provider';
import { Toaster } from '../components/ui/sonner';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'WellFlow',
  description: 'Oil & Gas Well Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          <MonitoringProvider>{children}</MonitoringProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
