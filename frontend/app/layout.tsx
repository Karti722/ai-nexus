import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Nexus",
  description:
    "A hands-on, full-stack tour of core AI engineering concepts — LLMs, RAG, prompt engineering, AI agents, and MCP — for engineers and newcomers alike.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
