import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="ja">
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>
          <div className="min-h-screen">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      futarchy demo
                    </h1>
                    <span className="ml-2 text-sm text-gray-500">
                      Futarchy Platform
                    </span>
                  </div>
                  <nav className="flex space-x-8">
                    <a href="/" className="text-gray-900 hover:text-blue-600">
                      市場一覧
                    </a>
                    <a href="/dashboard" className="text-gray-700 hover:text-blue-600">
                      マイページ
                    </a>
                    <a href="/admin" className="text-gray-700 hover:text-blue-600">
                      管理者
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
