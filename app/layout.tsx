import type { Metadata } from "next";
import { Assistant, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/Navbar";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "סטודיו פילאטיס מכשירים",
  description: "שיעורי פילאטיס מכשירים מקצועיים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${assistant.variable} ${cormorant.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
