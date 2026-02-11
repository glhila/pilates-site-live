import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ראשי | עונג של פילאטיס",
  description: "דף הבית",
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] bg-brand-bg">
      {/* Editorial hero */}
      <section className="relative min-h-[80vh] flex items-center px-4 py-20 sm:px-6 lg:px-8 bg-brand-bg overflow-x-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left: image / visual */}
          <div className="reveal order-2 flex justify-center lg:order-1 lg:justify-start">
            <div className="relative h-64 w-64 sm:h-80 sm:w-80 lg:h-[22rem] lg:w-[22rem] rounded-[10rem] border border-brand-card-border bg-brand-bg-soft shadow-[0_24px_60px_rgba(74,78,68,0.18)] overflow-hidden flex items-center justify-center">
              <div className="text-center text-xs font-medium tracking-[0.25em] uppercase text-brand-primary-muted">
              ברוכה הבאה לאיזון שלך
              </div>
            </div>
          </div>

          {/* Right: editorial text */}
          <div className="reveal order-1 text-right text-brand-dark lg:order-2">
            <span className="mb-4 block text-[0.7rem] sm:text-xs font-medium tracking-[0.35em] uppercase text-brand-primary-muted">
              Mindful Movement • Organic Luxury
            </span>
            <h1 className="mb-5 font-serif text-4xl leading-[1.3] tracking-[0.06em] text-brand-dark sm:text-5xl lg:text-6xl">
              עונג של פילאטיס לגוף ולנפש
            </h1>
            <p className="mb-10 max-w-md text-sm leading-relaxed text-brand-primary-muted ml-auto">
             שיעורי פילאטיס מכשירים מותאמים אישית בקבוצות קטנות, עם דגש על תנועה
              נכונה, חיזוק הליבה ושקט פני. בואי לגלות מחדש את האיזון שלך
            </p>
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Link
                href="/#booking"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-2.5 text-sm font-medium text-white shadow-[0_10px_25px_-5px_rgba(74,78,68,0.18)] transition-all duration-200 hover:bg-brand-primary-soft hover:shadow-[0_18px_40px_-8px_rgba(74,78,68,0.22)] hover:-translate-y-0.5"
              >
                קביעת שיעור היכרות
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-brand-primary transition-all duration-300 hover:opacity-70"
              >
                לצפייה במערכת השעות
                <span className="text-lg">←</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-t border-brand-card-border/70 bg-brand-bg-soft/60 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-[0.75rem] text-brand-primary-muted sm:flex-row">
          <span className="tracking-[0.28em] uppercase">
            Featured in / Trusted by
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[0.7rem]">
            <span className="rounded-full bg-white/40 px-4 py-1">
              לקוחות פרטיים מכל הארץ
            </span>
            <span className="rounded-full bg-white/40 px-4 py-1">
              התמחות בשיקום ותנועה מודעת
            </span>
          </div>
        </div>
      </section>

      {/* Booking section – anchor for /#booking */}
      <section
        id="booking"
        className="border-t border-brand-primary-muted/30 bg-brand-bg-soft/40 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-serif text-2xl text-brand-dark">
            קביעת שיעור היכרות
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-brand-dark/80">
            רוצה להרגיש איך זה בגוף שלך? השאירי פרטים או צרי קשר ונחזור אלייך
            לתיאום שיעור ראשון מותאם אישית.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-2.5 text-sm font-medium text-white shadow-[0_10px_25px_-5px_rgba(74,78,68,0.18)] transition-all duration-200 hover:bg-brand-primary-soft"
          >
            צרי קשר להזמנת שיעור
          </Link>
        </div>
      </section>
    </main>
  );
}