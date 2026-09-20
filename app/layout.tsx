import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ShopProvider } from "@/hooks/useShop";
import { SplashScreen } from "@/components/branding/SplashScreen";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";

export const viewport: Viewport = {
  themeColor: "#eab308",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "SELLORA — Retail Intelligence for Small Businesses",
  description:
    "Turn every sale into a smarter stock decision. SELLORA connects billing, inventory and sales intelligence for small businesses.",
  keywords: [
    "retail intelligence",
    "POS billing",
    "inventory management",
    "kirana store software",
    "stock intelligence",
    "smart reordering",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SELLORA",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="min-h-full">
      <body className="min-h-full font-sans bg-white text-zinc-900 antialiased">
        <AuthProvider>
          <ShopProvider>
            <SplashScreen />
            <InstallAppPrompt />
            {children}
          </ShopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
