import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

import { SolanaWalletProvider } from "@/components/providers/SolanaWalletProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ppMonumentExtended = localFont({
  src: [
    {
      path: "../../public/fonts/pp-monument-extended-black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/pp-monument-extended-black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-monument",
  display: "swap",
});

const deutschlander = localFont({
  src: [
    {
      path: "../../public/fonts/deutschlander.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/deutschlander.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-deutschlander",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IslandDAO Pets",
  description:
    "Claim a Codex-compatible animated spirit pet for every IslandDAO Perks NFT you hold.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${ppMonumentExtended.variable} ${deutschlander.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SolanaWalletProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <Toaster richColors closeButton position="bottom-right" />
          </SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
