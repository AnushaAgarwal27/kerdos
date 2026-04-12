import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SilkBackground from "@/components/SilkBackground";
import KerdosWordmark from "@/components/KerdosWordmark";
import { Geist, Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const geist   = Geist({ subsets: ['latin'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display', weight: ['400','600','700','800'] });

export const metadata: Metadata = {
  title: "Kerdos — AI Credit Card Brain",
  description: "Swipe smart, invest smarter, track everything.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", geist.variable, manrope.variable)}>
      <body className="min-h-full flex flex-col" style={{ color: "var(--text)" }}>
        <SilkBackground />
        <Navbar />
        <KerdosWordmark />
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
