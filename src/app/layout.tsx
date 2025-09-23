import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import "@/lib/initialize-websocket";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsApp Second Brain - AI-Powered Knowledge Management",
  description: "Comprehensive Second Brain knowledge management system with WhatsApp Bot Integration. Capture, organize, and interact with your thoughts, tasks, and projects through an intelligent WhatsApp interface.",
  keywords: ["whatsapp", "bot", "knowledge management", "second brain", "AI", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "productivity"],
  authors: [{ name: "cornmankl" }],
  openGraph: {
    title: "WhatsApp Second Brain",
    description: "AI-powered knowledge management with WhatsApp bot integration",
    url: "https://github.com/cornmankl/whatsapp-qr-optimizer",
    siteName: "WhatsApp Second Brain",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp Second Brain",
    description: "AI-powered knowledge management with WhatsApp bot integration",
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
