import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import "./globals.css";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
});

const bodyFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AI Nexus",
  description:
    "A hands-on, full-stack tour of core AI engineering concepts (LLMs, RAG, prompt engineering, AI agents and MCP) for engineers and newcomers alike.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen">
        {/* No-JS safety net: Reveal.tsx's scroll animations start content at
            opacity-0 until JavaScript confirms it's actually visible on
            screen. Without this, a page with JS disabled would never show
            that content at all. */}
        <noscript>
          <style>{`.js-reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <ReadingProgressBar />
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
