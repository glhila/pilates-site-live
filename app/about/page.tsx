import { Metadata } from "next";
import Link from "next/link";
import { getWhatsAppLink } from "@/src/lib/constants";
import { WhatsAppIcon } from "@/src/components/icons";

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "אודות הסטודיו | העונג שבפילאטיס",
  description:
    "הכירו את עונג - מדריכת פילאטיס מכשירים מוסמכת בכפר סבא. שיעורים מקצועיים, אווירה תומכת ותוצאות אמיתיות.",
};

// ─── Data: credentials ────────────────────────────────────────────────────
const CREDENTIALS = [
  {
    title: "פילאטיס מכשירים - גישה תומכת שיקום",
    detail: "Rehabilitation · Certified",
  },
  {
    title: "פילאטיס מכשירים - גישה פונקציונלית",
    detail: "Functional · Certified",
  },
  {
    title: "פילאטיס מכשירים - גישה קלאסית",
    detail: "Classical · Certified",
  },
  {
    title: "פילאטיס בר",
    detail: "Pilates Bar · Certified",
  },
  {
    title: "אימון משקל גוף",
    detail: "Bodyweight Training · Certified",
  },
  {
    title: "ניסיון ניהולי בסטודיו",
    detail: "Studio Management · Experience",
  },
];

// ─── Data: values ─────────────────────────────────────────────────────────
const VALUES = [
  {
    word: "Precision",
    hebrew: "דיוק",
    desc: "כל תנועה מכוונת. לומדים לזהות את הגוף, לא להתגבר עליו.",
  },
  {
    word: "Presence",
    hebrew: "נוכחות",
    desc: "השיעור הוא מרחב לעצמך - ללא הסחות, רק חיבור אמיתי לגוף ולנשימה.",
  },
  {
    word: "Progress",
    hebrew: "התקדמות",
    desc: "בקצב שלך, עם ליווי מקצועי שרואה אותך ומתאים את האימון בדיוק אליך.",
  },
];

export default function AboutPage() {
  const whatsappLink = getWhatsAppLink(
    "היי! קראתי על הסטודיו ואשמח לשמוע עוד ולתאם שיעור היכרות 🧘‍♀️✨"
  );

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg" dir="rtl">
      <div className="container mx-auto px-6 py-20 max-w-5xl">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-24 text-center">
          <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
            The Story · Movement with Heart
          </span>
          <h1 className="hero-title mb-4">
            הסיפור <span className="luxury-italic text-brand-accent-text">שלנו</span>
          </h1>
          <p className="max-w-xl mx-auto font-light text-brand-primary/70 italic">
            תנועה שמגיעה מהלב, מדריכה שמקשיבה לגוף שלך.
          </p>
        </header>

        {/* ─── Story ──────────────────────────────────────────────────────── */}
        <section className="mb-32">
          <div className="feature-card">
            <div className="grid md:grid-cols-2 gap-12 items-start">

              {/* Personal story */}
              <div className="space-y-6 font-light text-brand-primary/80 leading-relaxed text-base">
                <p>
                  שמי עונג, מדריכת פילאטיס מתוך אהבה גדולה לתנועה ובריאות הנפש.
                </p>
                <p>
                  לאחר שינוי משמעותי שעברתי בחיי, בחרתי ללכת בעקבות הלב -
                  והחלטתי להפוך את האהבה שלי לפילאטיס למקצוע לכל החיים.
                </p>
                <p>
                  בשיעורים שלי אני משלבת חיזוק, מודעות תנועתית והקשבה לגוף,
                  באווירה נעימה ותומכת. המטרה שלי היא לעזור לכל אחת ואחד
                  להתחזק, לשפר יציבה, להרגיש טוב יותר בגוף ולהנות מתנועה בריאה
                  ומדויקת.
                </p>
                <p>
                  אני מאמינה בתנועה ככלי ריפוי ושיפור איכות החיים בכל גיל.
                </p>
              </div>

              {/* ── 💡 תוספת מומלצת: ציטוט + הזמנה ── */}
              <div className="space-y-8">
                <blockquote className="border-r-2 border-brand-accent/40 pr-6">
                  <p className="font-serif italic text-xl text-brand-primary leading-relaxed">
                    "תנועה היא לא עונש לגוף - היא מתנה שאנחנו נותנים לעצמנו כל יום."
                  </p>
                </blockquote>

                <p className="font-light text-brand-primary/80 leading-relaxed">
                  אני מזמינה אתכם להצטרף אליי לאימוני פילאטיס שבהם נחזק את הגוף
                  ונאזן את הנפש. בואו להיות חלק מהמסע שלי.
                </p>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-luxury inline-flex"
                >
                  קביעת שיעור היכרות <WhatsAppIcon className="w-4 h-4 shrink-0" />
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ─── Values – 💡 תוספת מומלצת ─────────────────────────────────── */}
        <section className="mb-32">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-brand-primary mb-2">
              מה שמנחה <span className="luxury-italic text-brand-accent-text">אותי</span>
            </h2>
            <div className="h-px w-20 bg-brand-accent/30 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {VALUES.map(({ word, hebrew, desc }) => (
              <div
                key={word}
                className="feature-card text-center group"
              >
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-accent-text mb-2">
                  {word}
                </p>
                <h3 className="font-serif text-2xl text-brand-primary mb-4 group-hover:text-brand-accent-text transition-colors">
                  {hebrew}
                </h3>
                <p className="font-light text-brand-primary/70 text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Credentials ────────────────────────────────────────────────── */}
        <section className="mb-32">
          <div className="mb-16">
            <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
              Qualifications · Expertise
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-brand-primary">
              הכשרות <span className="luxury-italic text-brand-accent-text">ותעודות</span>
            </h2>
          </div>

          <div className="space-y-0">
            {CREDENTIALS.map(({ title, detail }, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between border-b border-brand-stone/40 py-7 transition-all hover:bg-white/20 gap-4"
              >
                <h3 className="text-lg md:text-xl font-light text-brand-dark group-hover:text-brand-accent-text transition-colors">
                  {title}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-primary/40 shrink-0">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA strip ──────────────────────────────────────────────────── */}
        <footer className="rounded-[3rem] bg-brand-bg-soft/60 border border-brand-stone/30 p-12 text-center space-y-6">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
            Start Your Journey · Mindful Movement
          </p>
          <h2 className="font-serif text-3xl text-brand-primary">
            מוכנים <span className="luxury-italic text-brand-accent-text">להתחיל?</span>
          </h2>
          {/* ── 💡 תוספת מומלצת: שיעור ניסיון ── */}
          <p className="font-light text-brand-primary/70 max-w-md mx-auto leading-relaxed">
            שיעור ניסיון ראשון בסטודיו - בואו לחוות את ההבדל בעצמכם, ללא התחייבות.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="btn-luxury"
            >
              קביעת שיעור ניסיון <WhatsAppIcon className="w-4 h-4 shrink-0" />
            </a>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-brand-primary hover:text-brand-accent-text transition-all duration-300"
            >
              לצפייה במערכת השעות
              <span className="text-lg">←</span>
            </Link>
          </div>
        </footer>

        {/* ─── Brand sign-off ───────────────────────────────────────────────── */}
        <div className="mt-24 text-center opacity-20">
          <p className="text-[9px] uppercase tracking-[0.6em] text-brand-primary">
            Inspired by Movement • Designed for You
          </p>
        </div>

      </div>
    </main>
  );
}