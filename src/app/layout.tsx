// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Service Layer Demo",
  description: "Next.js service layers and error handling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body>
        <ThemeToggle />
        <main className="devRhythmContainer" style={{ maxWidth: 960, margin: '0 auto', padding: '0 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}