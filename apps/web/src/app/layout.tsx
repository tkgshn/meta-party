import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import WalletErrorBoundary from "@/components/WalletErrorBoundary";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Ultrathink Futarchy Platform",
  description: "Prediction market governance platform for better decision making",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans bg-gray-50" suppressHydrationWarning>
        <WalletErrorBoundary>
          <Providers>
            <div className="min-h-screen flex flex-col">
              {children}
            </div>
          </Providers>
        </WalletErrorBoundary>
      </body>
    </html>
  );
}
