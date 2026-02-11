import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "מערכת שעות ושיעורים | עונג פילאטיס",
  description: "מערכת שבועית ומגוון שיעורי פילאטיס מכשירים: רפורמר, קדילאק, שיעורי שיקום ופילאטיס לנשים בהריון.",
};

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

const SCHEDULE = [
  { day: "ראשון", slots: [{ time: "09:00", name: "רפורמר" }, { time: "10:30", name: "קדילאק" }, { time: "18:00", name: "רפורמר" }] },
  { day: "שני", slots: [{ time: "07:30", name: "רפורמר" }, { time: "19:00", name: "שיקומי" }] },
  { day: "שלישי", slots: [{ time: "09:00", name: "רפורמר" }, { time: "10:30", name: "הריון" }, { time: "18:00", name: "קדילאק" }] },
  { day: "רביעי", slots: [{ time: "08:00", name: "רפורמר" }, { time: "19:00", name: "רפורמר" }] },
  { day: "חמישי", slots: [{ time: "09:00", name: "קדילאק" }, { time: "18:00", name: "רפורמר" }] },
  { day: "שישי", slots: [{ time: "08:00", name: "רפורמר" }, { time: "09:30", name: "שיקומי" }] },
];

function buildScheduleTable() {
  const byDay: Record<string, Record<string, string>> = {};
  const timeSet = new Set<string>();
  for (const row of SCHEDULE) {
    byDay[row.day] = {};
    for (const slot of row.slots) {
      byDay[row.day][slot.time] = slot.name;
      timeSet.add(slot.time);
    }
  }
  const times = Array.from(timeSet).sort();
  return { byDay, times };
}

const LESSONS = [
  { title: "פילאטיס רפורמר", desc: "השיעור הקלאסי על המכשיר הפופולרי ביותר. עבודה על כוח, גמישות ויציבה.", id: "reformer" },
  { title: "שיעורי קדילאק (Tower)", desc: "עבודה אינטנסיבית יותר עם קפיצים גבוהים לשיפור טווחי תנועה.", id: "cadillac" },
  { title: "פילאטיס לנשים בהריון", desc: "שיעור מותאם לשינויים בגוף, דגש על רצפת אגן ונשימה נכונה.", id: "pregnancy" },
  { title: "פילאטיס שיקומי", desc: "שיעור בקבוצות קטנות מאוד עם דגש על פציעות גב, ברכיים וצוואר.", id: "rehab" },
];

export default function ClassesPage() {
  const { byDay, times } = buildScheduleTable();

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        
        {/* Header Section */}
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

        {/* Schedule Table Section */}
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
                  {times.map((time) => (
                    <tr key={time} className="border-b border-brand-stone/10 last:border-b-0 hover:bg-white/40 transition-colors">
                      <td className="py-5 px-6 font-serif italic text-brand-primary/80">{time}</td>
                      {WEEKDAYS.map((day) => {
                        const name = byDay[day]?.[time];
                        return (
                          <td key={day} className="py-5 px-4">
                            {name ? (
                              <div className="group relative">
                                <span className="inline-block rounded-full border border-brand-accent/20 bg-brand-accent/5 px-4 py-1 text-[11px] font-semibold text-brand-accent-text transition-all group-hover:border-brand-accent group-hover:bg-brand-accent/10">
                                  {name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-brand-stone/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-6 text-center text-[10px] text-brand-stone uppercase tracking-widest md:hidden">
            ← ניתן לגלול לצדדים לצפייה בכל המערכת →
          </p>
        </section>

        {/* Lesson Types Section */}
        <section id="lesson-types">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-serif text-brand-primary mb-4">סוגי השיעורים</h2>
            <div className="h-px w-20 bg-brand-accent/30 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {LESSONS.map((lesson) => (
              <article
                key={lesson.id}
                className="feature-card group"
              >
                <h3 className="text-2xl font-serif text-brand-primary mb-4 group-hover:text-brand-accent-text transition-colors">
                  {lesson.title}
                </h3>
                <p className="text-brand-primary/70 font-light leading-relaxed mb-8">
                  {lesson.desc}
                </p>
                <Link
                  href="/contact"
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary border-b border-brand-stone/50 pb-2 hover:border-brand-accent transition-all inline-flex items-center gap-2"
                >
                  למידע והרשמה 
                  <span className="text-lg leading-none">←</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}