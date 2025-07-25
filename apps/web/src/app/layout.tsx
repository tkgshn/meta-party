import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import WalletErrorBoundary from "@/components/WalletErrorBoundary";
import ReownContextProvider from '@/context/reownContext';
import { headers } from "next/headers";
import { StagewiseToolbar } from '@stagewise/toolbar-next';
import ReactPlugin from '@stagewise-plugins/react';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Futarchy Platform",
  description: "Prediction market governance platform for better decision making",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = (await headers()).get('cookie')

  return (
    <html lang="ja" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
        <ReownContextProvider cookies={cookies}>
          <WalletErrorBoundary>
            <Providers>
              <div className="min-h-screen flex flex-col">
                {children}
              </div>
              <StagewiseToolbar
                config={{
                  plugins: [ReactPlugin],
                }}
              />
            </Providers>
          </WalletErrorBoundary>
        </ReownContextProvider>
      </body>
    </html>
  );
}
