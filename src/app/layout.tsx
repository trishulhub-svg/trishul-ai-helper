import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trishul AI Helper - Your Code Knowledge Base & AI Agent",
  description: "Trishul AI Helper — your AI-powered code knowledge base that holds all your company's project data and code. Chat with AI to generate, update, and debug code with complete, copy-paste ready results.",
  keywords: ["Trishul AI Helper", "Trishulhub", "AI Agent", "Code Assistant", "Knowledge Base", "Code Generation", "Next.js"],
  authors: [{ name: "Trishul AI Helper" }],
  icons: {
    icon: "/trishul-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
