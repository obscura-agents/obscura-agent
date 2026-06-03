import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "./components/Nav";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Obscura Agent — private research that leaves no trace",
  description:
    "An autonomous research agent on Venice. It investigates anything legitimate, refuses nothing legitimate, leaves no trace — and proves, step by step, that it never leaked.",
  openGraph: {
    title: "Obscura Agent",
    description: "The autonomous research agent that leaves no trace. Powered by Venice.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Obscura Agent",
    description: "The autonomous research agent that leaves no trace. Powered by Venice.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
