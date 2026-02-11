import type { Metadata } from "next";
import { Assistant, Cormorant_Garamond, Cardo } from "next/font/google";
import "./globals.css";
import Navbar from "@/Navbar";
import Footer from "../src/components/Footer";
import { ClerkProvider } from '@clerk/nextjs'

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
});

const cardo = Cardo ({
  variable: "--font-assistant",
  subsets: ["latin"],
  weight:  "400",
  style: ["italic"],
})

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "סטודיו פילאטיס מכשירים",
  description: "שיעורי פילאטיס מכשירים מקצועיים",
};

export const application: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#3D3935",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="he" dir="rtl" className={`${assistant.className} ${cardo.variable}`}>
      <body
        className="antialiased">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 bg-brand-dark text-white px-4 py-2 rounded-md z-[100]">
            דלג לתוכן המרכזי
          </a>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
    </ClerkProvider>
  );
}
