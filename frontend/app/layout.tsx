import type { Metadata } from "next";
import { Inter, Inconsolata } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
});

export const metadata: Metadata = {
  title: "Nano — Secrets & Config Manager",
  description: "Secure, simple secrets management for engineering teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full dark ${inter.variable} ${inconsolata.variable}`}>
      <body className={`${inter.className} h-full bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary`}>
        {children}
      </body>
    </html>
  );
}
