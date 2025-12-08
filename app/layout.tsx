import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Behavior CRM",
  description: "데이터 기반 행동 분석 및 성과 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavbarWrapper />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
