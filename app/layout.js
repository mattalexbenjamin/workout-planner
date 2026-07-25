import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Header, BottomNav } from '@/components/Navbar';

export const metadata = {
  title: "APEX Summer '26 | Athletic Recommender & PWA Tracker",
  description: "Adaptive, mobile-first PWA training app for sand volleyball, flag football, weightlifting, and running.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0B0E14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          <Header />
          <main className="app-content">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
