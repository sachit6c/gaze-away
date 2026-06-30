import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Gaze Away — Tonight's Best Sky Objects",
  description: "Find what constellations, planets, and satellites are best to view tonight from your location.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
