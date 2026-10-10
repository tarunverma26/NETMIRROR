import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioProvider } from '@/context/AudioContext';
import Navbar from '@/components/ui/Navbar';
import StickyAudioPlayer from '@/components/player/StickyAudioPlayer';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'REELBEAT — Premium Cinematic Streaming',
  description:
    'Stream the finest Movies, Songs, and Web Series across Bollywood, Hollywood, Bhojpuri, and Tollywood with 3D visuals and lossless audio.',
  keywords: [
    'movies',
    'songs',
    'web series',
    'bollywood',
    'hollywood',
    'bhojpuri',
    'tollywood',
    'streaming',
  ],
  authors: [{ name: 'REELBEAT Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#0A0A0A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col selection:bg-primary selection:text-white">
        <AuthProvider>
          <AudioProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
            <StickyAudioPlayer />
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
