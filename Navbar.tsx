"use client";

import Link from "next/link";
import React from "react";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

const links = [
  { href: "/", label: "בית" },
  { href: "/about", label: "אודות" },
  { href: "/pricing", label: "מחירון" },
  { href: "/contact", label: "צור קשר" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();

  // המייל שלך - ודאי שהוא כתוב באותיות קטנות (lowercase)
  const adminEmail = "hilaglazz13@gmail.com".toLowerCase(); 
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  
  // בדיקה האם המשתמש הוא אדמין
  const isAdmin = userEmail === adminEmail;

  const actionPath = isAdmin ? "/admin" : "/users";
  const actionLabel = isAdmin ? "ניהול סטודיו" : "קביעת שיעור";

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 text-brand-dark backdrop-blur border-b border-brand-stone/30">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          
          {/* לוגו */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png"
                alt="עונג פילאטיס" 
                width={120}
                height={50} 
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* תפריט דסקטופ */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <SignedIn>
              <Link
                href={actionPath}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-all"
              >
                {isAdmin && <span>⚙️</span>}
                {actionLabel}
              </Link>
            </SignedIn>
          </div>

          {/* כפתורי התחברות ופרופיל */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-brand-dark text-white px-5 py-2 rounded-full text-xs font-bold uppercase">
                  התחברות
                </button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* כפתור המבורגר לנייד */}
            <button
              type="button"
              className="md:hidden p-2 text-brand-dark"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="flex flex-col gap-1.5">
                <span className={`block h-0.5 w-5 bg-brand-dark transition-all ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 w-5 bg-brand-dark ${isOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-5 bg-brand-dark transition-all ${isOpen ? "-rotate-45 -translate-y-1" : ""}`} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* תפריט נייד */}
      {isOpen && (
        <div className="md:hidden bg-brand-bg-soft border-b border-brand-stone/30 p-4">
          <ul className="flex flex-col gap-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block text-base font-medium" onClick={() => setIsOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <SignedIn>
              <li>
                <Link href={actionPath} className="block bg-brand-dark text-white p-3 rounded-lg text-center font-bold" onClick={() => setIsOpen(false)}>
                  {actionLabel}
                </Link>
              </li>
            </SignedIn>
          </ul>
        </div>
      )}
    </header>
  );
}