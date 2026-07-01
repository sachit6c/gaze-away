import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Gaze Away — Tonight's Best Sky Objects",
  description:
    "Find what constellations, planets, and satellites are best to view tonight from your location.",
};

export const viewport: Viewport = {
  themeColor: "#04060d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen antialiased font-sans">
        <div className="sky" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
