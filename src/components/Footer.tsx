"use client";

export default function Footer() {
  const handleBackToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-brand-primary-muted/40 bg-brand-bg">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-right text-xs text-brand-dark/80 sm:flex-row sm:items-center sm:justify-between sm:text-[0.8rem]">
        <div className="space-y-2">
          <div className="text-[0.78rem] font-medium tracking-[0.2em] uppercase text-brand-primary-muted">
            Follow Us
          </div>
          <a
            href="https://www.instagram.com/oneg_griz.maman/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-brand-accent hover:text-brand-primary transition-colors"
          >
            Instagram
            <span aria-hidden="true" className="text-[0.8rem]">
              ↗
            </span>
          </a>
        </div>

        <div className="space-y-1 text-[0.78rem] leading-relaxed">
          <p>רחוב [שם הרחוב], כפר סבא</p>
          <p>טלפון: 052-640-9993</p>
        </div>

        <div className="pt-2 sm:pt-0">
          <button
            type="button"
            onClick={handleBackToTop}
            className="inline-flex items-center justify-center rounded-full border border-brand-primary-muted/60 bg-brand-bg-soft px-4 py-1.5 text-[0.78rem] font-medium text-brand-dark hover:bg-brand-primary-muted/10 transition-colors"
          >
            חזרה לראש הדף
          </button>
        </div>
      </div>
    </footer>
  );
}

