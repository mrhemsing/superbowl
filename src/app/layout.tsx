import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Bowls I–LX",
  description: "Oversized logos, numbers, and collapsible summaries for every Super Bowl.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
