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
    <header className="sticky top-0 z-50 bg-brand-bg/95 text-brand-dark backdrop-blur border-b border-brand-primary-muted">
      <div className="mx-auto max-w-7xl">
      <nav className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 flex-row-reverse">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-brand-primary-soft/20 border border-brand-primary-soft flex items-center justify-center">
              <span className="px-2 text-[10px] font-semibold leading-tight text-center text-brand-primary">
                עונג של פילאטיס
              </span>
            </div>
            <span className="hidden text-base font-semibold tracking-tight sm:inline">
              סטודיו פילאטיס
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
        
        <SignedOut>
          {/* מה שמופיע כשהמשתמשת לא מחוברת */}
          <SignInButton mode="modal">
            <button className="bg-brand-dark text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90">
              התחברות
            </button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          {/* מה שמופיע כשהמשתמשת מחוברת */}
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium text-brand-dark">האזור האישי</a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>

        
        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex flex-row-reverse">
          <ul className="flex items-center gap-6 text-sm">
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
            href="/#booking"
            className="inline-flex items-center justify-center rounded-full border border-brand-accent px-5 py-2 text-sm font-medium text-brand-accent bg-transparent transition-all duration-300 hover:bg-brand-accent hover:text-white"
          >
            קביעת שיעור
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-brand-primary-muted bg-brand-bg-soft p-2 text-brand-dark shadow-sm transition hover:bg-brand-bg"
          aria-label="פתח תפריט"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="sr-only">תפריט</span>
          <span className="flex flex-col gap-1.5">
            <span
              className={`block h-0.5 w-5 rounded-full bg-brand-dark transition-transform ${
                isOpen ? "translate-y-[5px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-4 rounded-full bg-brand-dark transition-opacity ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-brand-dark transition-transform ${
                isOpen ? "-translate-y-[5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>
      </div>

      {/* Mobile nav panel */}
      {isOpen && (
        <div className="border-b border-brand-primary-muted bg-brand-bg-soft md:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-2 sm:px-6 lg:px-8">
            <ul className="flex flex-col items-stretch gap-2 text-sm text-brand-dark">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex w-full justify-between rounded-lg px-3 py-2 transition-colors hover:bg-brand-bg"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/#booking"
              className="mt-3 flex w-full items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-primary-soft"
              onClick={() => setIsOpen(false)}
            >
              קביעת שיעור
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

