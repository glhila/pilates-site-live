import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ראשי | עונג של פילאטיס",
  description: "דף הבית",
};

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-brand-bg">
      <section className="relative min-h-[80vh] flex items-center px-4 py-20 sm:px-6 lg:px-8 bg-brand-bg">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 lg:grid-cols-2">
          {/* Text content */}
          <div className="reveal text-right text-brand-dark relative">
            <span className="mb-5 block text-xs sm:text-sm font-medium tracking-[0.3em] text-brand-primary-muted">
              ברוכה הבאה לאיזון שלך
            </span>
            <h1 className="hero-title mb-8">
              עונג של פילאטיס <br className="hidden sm:inline" />
              לגוף ולנפש.
            </h1>
            <p className="mb-10 max-w-md text-base leading-relaxed text-brand-dark/80 ml-auto">
              שיעורי פילאטיס מכשירים מותאמים אישית בקבוצות קטנות, עם דגש על תנועה
              נכונה, חיזוק הליבה ושקט פנימי. בואי לגלות מחדש את האיזון שלך.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Link
                href="/#booking"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-2.5 text-sm font-medium text-white shadow-[0_10px_25px_-5px_rgba(31,61,54,0.15)] transition-all duration-200 hover:bg-brand-primary-soft hover:shadow-[0_15px_30px_-5px_rgba(31,61,54,0.25)] hover:-translate-y-0.5"
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

          {/* Visual feature card */}
          <div className="relative reveal lg:order-first" style={{ animationDelay: "0.2s" }}>
            <div className="feature-card relative z-10 overflow-hidden">
              <div className="flex h-full min-h-[260px] items-center justify-center">
                <div className="space-y-3 text-center text-brand-dark/80">
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-primary/60">
                    Pilates Studio
                  </p>
                  <p className="text-lg font-semibold text-brand-accent">
                    תנועה עדינה, חיזוק עמוק, נשימה מודעת.
                  </p>
                  <p className="text-xs leading-relaxed">
                    עיצוב חטוב, שיפור יציבה וקלילות במפרקים – באווירה שקטה
                    ומוקפדת.
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -top-10 -left-10 h-64 w-64 -translate-x-6 translate-y-4 rounded-full bg-brand-primary-muted/20 blur-3xl" />
          </div>
        </div>
        <div className="pointer-events-none absolute -top-6 right-0 h-64 w-64 translate-x-6 rounded-full bg-brand-bg-soft/50 blur-[100px]" />
      </section>
    </main>
  );
}