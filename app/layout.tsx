import type { Metadata } from "next";
import { Assistant, Cormorant_Garamond, Cardo } from "next/font/google";
import "./globals.css";
import Navbar from "@/Navbar";
import Footer from "../src/components/Footer";

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700"],
});

const cardo = Cardo ({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  weight:  "400",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.className} ${cardo.variable}`}>
      <body
        className="antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
