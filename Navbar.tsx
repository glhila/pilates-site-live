"use client";

import Link from "next/link";
import React from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";

const links = [
  { href: "/", label: "בית" },
  { href: "/about", label: "אודות" },
  { href: "/classes", label: "שיעורים" },
  { href: "/pricing", label: "מחירון" },
  { href: "/contact", label: "צור קשר" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 text-brand-dark backdrop-blur border-b border-brand-stone/30">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          
          {/* 1. לוגו - שימוש בצבע הזית העמוק החדש */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center transition-transform hover:scale-105">
            <Image 
            src="/logo.png" //
            alt="עונג פילאטיס לוגו" 
            width={120}    // התאימי את הגודל לפי הצורך
            height={50}     
            className="h-12 w-auto object-contain sm:h-14" // הגובה יתאים את עצמו
            priority        // מבטיח שהלוגו ייטען ראשון (חשוב ל-LCP)
          />
        </Link>
      </div>

          {/* 2. תפריט דסקטופ - שיפור ריווח אותיות (Luxury feel) */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6 text-sm font-medium tracking-wide">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-brand-dark/90 hover:text-brand-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-full bg-brand-dark px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-90 shadow-md shadow-brand-dark/10"
            >
              קביעת שיעור
            </Link>
          </div>

          {/* 3. קבוצת הפעולות (לוגין והמבורגר) */}
          <div className="flex items-center gap-3">
            
            <div className="flex items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-brand-dark text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                    התחברות
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-brand-dark hover:text-brand-primary transition-colors">
                    האזור האישי
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>

            {/* כפתור המבורגר - שימוש ב-brand-stone לקווי מתאר עדינים */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-brand-stone bg-brand-bg-soft p-2 text-brand-dark transition hover:bg-brand-bg"
              aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <span className="flex flex-col gap-1.5">
                <span className={`block h-0.5 w-5 rounded-full bg-brand-dark transition-all ${isOpen ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`block h-0.5 w-4 rounded-full bg-brand-dark transition-all ${isOpen ? "opacity-0" : "opacity-100"}`} />
                <span className={`block h-0.5 w-5 rounded-full bg-brand-dark transition-all ${isOpen ? "-translate-y-[5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>

        </nav>
      </div>

      {/* תפריט נפתח לנייד - התאמת צבעים */}
      {isOpen && (
        <div className="border-b border-brand-stone/30 bg-brand-bg-soft md:hidden animate-in slide-in-from-top duration-300">
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-2">
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-brand-dark hover:bg-brand-primary/5 hover:text-brand-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}