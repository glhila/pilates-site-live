"use client";

import Link from "next/link";
import React from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

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
    <header className="sticky top-0 z-50 bg-brand-bg/95 text-brand-dark backdrop-blur border-b border-brand-border-light">
      <div className="mx-auto max-w-7xl">
        {/* ה-nav משתמש ב-justify-between כדי לפזר את האלמנטים לצדדים */}
        <nav className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          
          {/* 1. לוגו (צד ימין ב-RTL) */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-brand-primary-soft/20 border border-brand-primary-soft flex items-center justify-center transition-transform hover:scale-105">
                <span className="px-1 text-[9px] font-bold leading-tight text-center text-brand-primary">
                  עונג של <br/> פילאטיס
                </span>
              </div>
            </Link>
          </div>

          {/* 2. תפריט דסקטופ (מרכז - מוסתר בנייד) */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-brand-primary-soft"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-full border border-brand-dark px-5 py-2 text-sm font-medium transition-all hover:bg-brand-dark hover:text-white"
            >
              קביעת שיעור
            </Link>
          </div>

          {/* 3. קבוצת הפעולות (צד שמאל ב-RTL) - כאן איחדנו את הלוגין וההמבורגר */}
          <div className="flex items-center gap-3">
            
            {/* כפתורי התחברות / פרופיל */}
            <div className="flex items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-brand-dark text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity">
                    התחברות
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="hidden sm:inline text-xs font-medium text-brand-dark hover:underline">
                    האזור האישי
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>

            {/* כפתור המבורגר (נייד בלבד) */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-brand-border-light bg-brand-bg-soft p-2 text-brand-dark transition hover:bg-brand-bg"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <span className="sr-only">תפריט</span>
              <span className="flex flex-col gap-1.5">
                <span className={`block h-0.5 w-5 rounded-full bg-brand-dark transition-all ${isOpen ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`block h-0.5 w-4 rounded-full bg-brand-dark transition-all ${isOpen ? "opacity-0" : "opacity-100"}`} />
                <span className={`block h-0.5 w-5 rounded-full bg-brand-dark transition-all ${isOpen ? "-translate-y-[5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>

        </nav>
      </div>

      {/* תפריט נפתח לנייד */}
      {isOpen && (
        <div className="border-b border-brand-border-light bg-brand-bg-soft md:hidden animate-in slide-in-from-top duration-300">
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-2">
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-brand-dark hover:bg-brand-primary-soft/10"
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