import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מערכת שעות ושיעורים | פילאטיס מכשירים",
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

const LESSONS = [
  { title: "פילאטיס רפורמר", desc: "השיעור הקלאסי על המכשיר הפופולרי ביותר. עבודה על כוח, גמישות ויציבה.", id: "reformer" },
  { title: "שיעורי קדילאק (Tower)", desc: "עבודה אינטנסיבית יותר עם קפיצים גבוהים לשיפור טווחי תנועה.", id: "cadillac" },
  { title: "פילאטיס לנשים בהריון", desc: "שיעור מותאם לשינויים בגוף, דגש על רצפת אגן ונשימה נכונה.", id: "pregnancy" },
  { title: "פילאטיס שיקומי", desc: "שיעור בקבוצות קטנות מאוד עם דגש על פציעות גב, ברכיים וצוואר.", id: "rehab" },
];

export default function ClassesPage() {
  return(
    <main className="min-h-[calc(100vh-4rem)] bg-brand-bg">
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Schedule section */}
      <section className="mb-20">
        <h1 className="hero-title mb-2 text-center">מערכת שעות</h1>
        <p className="text-center text-brand-dark/70 mb-10">בחרי את היום המתאים והצטרפי אלינו</p>
        <div className="rounded-2xl border border-brand-primary-muted/40 bg-brand-bg-soft/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {SCHEDULE.map((row) => (
              <div
                key={row.day}
                className="p-5 border-b border-brand-primary-muted/20 last:border-b-0 md:border-b-0 md:even:border-r md:odd:border-r border-brand-primary-muted/20"
              >
                <h2 className="text-lg font-semibold text-brand-primary mb-4">{row.day}</h2>
                <ul className="space-y-2">
                    {row.slots.map((slot) => (
                      <li key={`${row.day}-${slot.time}`} className="flex justify-between text-sm text-brand-dark/80">
                        <span>{slot.time}</span>
                        <span className="font-medium text-brand-dark">{slot.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lesson types details */}
        <section id="lesson-types">
          <h2 className="hero-title mb-2 text-center">סוגי השיעורים</h2>
          <p className="text-center text-brand-dark/70 mb-12 max-w-xl mx-auto">הכירי את סוגי האימון שאנחנו מציעות בסטודיו</p>
          <div className="grid md:grid-cols-2 gap-8">
            {LESSONS.map((c) => (
              <article
                key={c.id}
                id={c.id}
                className="feature-card rounded-[2rem] p-8 bg-brand-bg-soft border border-brand-primary-muted/30"
              >
                <h3 className="text-xl font-semibold text-brand-dark mb-3">{c.title}</h3>
                <p className="text-brand-dark/70 leading-relaxed">{c.desc}</p>
                <a
                  href="/contact"
                  className="mt-6 inline-block text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors"
                  >
                  למידע והרשמה ←
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}