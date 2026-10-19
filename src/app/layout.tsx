import type { Metadata, Viewport } from "next";
import { Inter, Lilita_One, Nunito } from "next/font/google";
import { MascotDefs } from "@/components/Mascot";
import "./globals.css";

const display = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: "PokéQuest",
  description: "Turn real-life chores into quests. Earn XP worth real money (100 XP = $1).",
  appleWebApp: { capable: true, title: "PokéQuest", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3426c4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${ui.variable}`}>
      <body className="min-h-dvh">
        <MascotDefs />
        {children}
      </body>
    </html>
  );
}
