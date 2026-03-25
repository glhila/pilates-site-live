import { Metadata } from "next";
import { getWhatsAppLink, TIME_SLOTS, MORNING_START, LATEST_CLASS_START_HOUR } from "@/src/lib/constants";
import { WhatsAppIcon } from "@/src/components/icons";

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "מערכת שעות ושיעורים | העונג שבפילאטיס",
  description: "מערכת שבועית ומגוון שיעורי פילאטיס מכשירים: רפורמר, קדילאק, שיעורי שיקום ופילאטיס לנשים בהריון.",
};

// ─── Data ─────────────────────────────────────────────────────────────────
// כל השעות חייבות להיות מתוך TIME_SLOTS ב-constants
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"] as const;

const SCHEDULE: { day: typeof WEEKDAYS[number]; slots: Record<string, string> }[] = [
  { day: "ראשון",  slots: { "09:00": "רפורמר",  "11:00": "קדילאק",  "17:30": "רפורמר" } },
  { day: "שני",    slots: { "08:00": "רפורמר",  "19:30": "שיקומי"  } },
  { day: "שלישי", slots: { "09:00": "רפורמר",  "11:00": "רפורמר",   "18:30": "קדילאק" } },
  { day: "רביעי", slots: { "08:00": "רפורמר",  "20:30": "רפורמר"  } },
  { day: "חמישי", slots: { "09:00": "קדילאק",  "17:30": "רפורמר"  } },
  { day: "שישי",  slots: { "08:00": "רפורמר",  "09:00": "שיקומי"  } },
];

const LESSONS = [
  { id: "reformer", title: "פילאטיס רפורמר",       desc: "המכשיר הפופולרי ביותר. עבודה על גמישות, שיווי משקל וכוח." },
  { id: "cadillac", title: "שיעורי קדילאק (Tower)", desc: "עבודה עם מכשיר המעניק יציבות, תמיכה, עוזר בשיפור טווחי תנועה וחיזוק ה-power house." },
  { id: "rehab",    title: "פילאטיס שיקומי",        desc: "שיעור פרטי המתמקד בצרכיו האישיים של המתאמן. יכול להתאים לפציעות נוירולוגיות, אורטופדיות, שיקום רצפת אגן וקטיעות איברים." },
];

// ─── שעות הטבלה – מגיעות ישירות מ-TIME_SLOTS, מסוננות לפי MORNING_START/END ──
const DISPLAY_TIMES = TIME_SLOTS.filter((t) => {
  const hour = parseInt(t.split(":")[0], 10);
  return hour >= MORNING_START && hour <= LATEST_CLASS_START_HOUR;
});

const scheduleByDay = Object.fromEntries(
  SCHEDULE.map(({ day, slots }) => [day, slots])
);

export default function ClassesPage() {
  return (
    <main id="main-content" className="min-h-screen bg-brand-bg">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-20 text-center">
          <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
            Our Schedule • Time for You
          </span>
          <h1 className="hero-title mb-4">
            מערכת <span className="luxury-italic text-brand-accent-text">שעות</span>
          </h1>
          <p className="max-w-xl mx-auto font-light text-brand-primary/70 italic">
            בחרי את הרגע המדויק עבורך, והצטרפי אלינו לתנועה של רוגע ועוצמה.
          </p>
        </header>

        {/* ─── Schedule table ───────────────────────────────────────────────── */}
        <section className="mb-32">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-stone/30 bg-white/30 backdrop-blur-sm shadow-[0_20px_50px_rgba(62,69,55,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-right">
                <thead>
                  <tr className="border-b border-brand-stone/30 bg-brand-bg-soft/50">
                    <th className="py-6 px-6 font-serif italic text-lg text-brand-primary">שעה</th>
                    {WEEKDAYS.map((day) => (
                      <th key={day} className="py-6 px-4 text-xs font-bold uppercase tracking-widest text-brand-primary">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-sans">
                  {DISPLAY_TIMES.map((time) => {
                    const hasAny = WEEKDAYS.some((day) => scheduleByDay[day]?.[time]);
                    if (!hasAny) return null;
                    return (
                      <tr key={time} className="border-b border-brand-stone/10 last:border-b-0 hover:bg-white/40 transition-colors">
                        <td className="py-5 px-6 font-serif italic text-brand-primary/80">{time}</td>
                        {WEEKDAYS.map((day) => {
                          const name = scheduleByDay[day]?.[time];
                          return (
                            <td key={day} className="py-5 px-4">
                              {name ? (
                                <span className="inline-block rounded-full border border-brand-accent/20 bg-brand-accent/5 px-4 py-1 text-[11px] font-semibold text-brand-accent-text hover:border-brand-accent hover:bg-brand-accent/10 transition-all">
                                  {name}
                                </span>
                              ) : (
                                <span className="text-brand-stone/40">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-6 text-center text-[10px] text-brand-stone uppercase tracking-widest md:hidden">
            ← ניתן לגלול לצדדים לצפייה בכל המערכת →
          </p>
        </section>

        {/* ─── Lesson types ─────────────────────────────────────────────────── */}
        <section id="lesson-types">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-serif text-brand-primary mb-4">סוגי השיעורים</h2>
            <div className="h-px w-20 bg-brand-accent/30 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {LESSONS.map((lesson) => {
              const waLink = getWhatsAppLink(
                `היי! אני מתעניינת בשיעור "${lesson.title}" שראיתי באתר, אשמח לפרטים נוספים ✨`
              );
              return (
                <article key={lesson.id} className="feature-card group">
                  <h3 className="text-2xl font-serif text-brand-primary mb-4 group-hover:text-brand-accent-text transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-brand-primary/70 font-light leading-relaxed mb-8">
                    {lesson.desc}
                  </p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary border-b border-brand-stone/50 pb-2 hover:border-brand-accent hover:text-brand-accent-text transition-all inline-flex items-center gap-2"
                  >
                    למידע והרשמה
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}