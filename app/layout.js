import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Header, BottomNav } from '@/components/Navbar';

export const metadata = {
  title: "APEX Summer '26 | Athletic Recommender & PWA Tracker",
  description: "Adaptive, mobile-first PWA training app for sand volleyball, flag football, weightlifting, and running.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0F172A",
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
