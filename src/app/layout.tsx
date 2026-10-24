import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';

export const metadata: Metadata = {
  title: 'Hyderabad Tourist Guide | Heritage, Metro, Bus & Trip Planner',
  description:
    'All-in-one smart travel guide for Hyderabad. Discover Charminar, Golconda Fort, and Nizam palaces. Plan multi-modal routes across HMRL Metro, MMTS, and TGSRTC buses with real-time costs and itineraries.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#11131a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-nizami-gold/30 selection:text-nizami-gold">
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 flex max-w-7xl w-full mx-auto">
              <Sidebar />
              <main className="flex-1 pb-20 lg:pb-8 overflow-x-hidden min-w-0">
                {children}
              </main>
            </div>
            <BottomNav />
            <AIAssistantWidget />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
