import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'Plex2Stash — Metadata Provider Manager',
  description: 'Bridge StashApp with Plex as a custom Metadata Provider',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
