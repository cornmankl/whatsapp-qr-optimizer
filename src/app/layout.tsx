import type { Metadata } from "next";
// Use local fonts or fallback fonts instead of Google Fonts for better reliability
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "WhatsApp QR Optimizer - AI-Powered WhatsApp Management",
  description: "Modern Next.js application for WhatsApp QR code optimization and AI-powered messaging. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["WhatsApp", "QR Code", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "WhatsApp QR Optimizer Team" }],
  openGraph: {
    title: "WhatsApp QR Optimizer",
    description: "AI-powered WhatsApp management with modern React stack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp QR Optimizer",
    description: "AI-powered WhatsApp management with modern React stack",
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
        className="antialiased bg-background text-foreground font-sans"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
