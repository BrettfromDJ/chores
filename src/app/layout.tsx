import type { Metadata, Viewport } from "next";
import { Inter, Nunito, Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: "PokéQuest",
  description: "Turn real-life chores into quests. Earn XP, level up, and unlock card rewards.",
  appleWebApp: { capable: true, title: "PokéQuest", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff8e8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable} ${ui.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
