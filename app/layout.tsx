import type { Metadata, Viewport } from "next";
import { Assistant, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/Navbar"; 
import Footer from "@/src/components/Footer"; 
import { ClerkProvider } from '@clerk/nextjs'

// פונט עברי נקי - משקלים קלים נותנים מראה יוקרתי
const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-assistant",
});

// פונט סריפי לכותרות - דק ואלגנטי (כמו המילה "פילאטיס" בלוגו)
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300"],
  style: ["italic", "normal"],
  variable: "--font-serif",
});

// איחוד כל המטא-דאטה לאובייקט אחד תקני
export const metadata: Metadata = {
  title: "עונג פילאטיס | סטודיו פילאטיס מכשירים בוטיק",
  description: "סטודיו פילאטיס מכשירים באווירה אינטימית, רכה ויוקרתית. תנועה נכונה, חיזוק הליבה ושקט פנימי.",
  manifest: "/manifest.json",
};

// הגדרות Viewport בנפרד (הסטנדרט החדש ב-Next.js)
export const viewport: Viewport = {
  themeColor: "#3E4537", // הצבע הירוק-זית מהלוגו שלך
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      {/* מחברים את המשתנים של הפונטים ל-HTML */}
      <html lang="he" dir="rtl" className={`${assistant.variable} ${cormorant.variable}`}>
        <body className="antialiased font-sans">
          {/* נגישות: קישור נסתר למקלדת */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 bg-brand-primary text-white px-4 py-2 rounded-md z-[100]"
          >
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