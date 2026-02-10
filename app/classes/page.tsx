import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מערכת שעות ושיעורים | עונג של פילאטיס",
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
    <main className="min-h-[calc(100vh-4rem)] bg-brand-bg">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Schedule section – weekly calendar table */}
        <section className="mb-20">
          <h1 className="hero-title mb-2 text-center">מערכת שעות</h1>
          <p className="text-center text-brand-dark/70 mb-10">בחרי את היום והשעה המתאימים והצטרפי אלינו</p>
          <div className="rounded-2xl border border-brand-primary-muted/40 bg-brand-bg-soft/80 shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-right">
              <thead>
                <tr className="border-b border-brand-primary-muted/40 bg-brand-primary-muted/10">
                  <th className="py-3 px-4 text-sm font-semibold text-brand-dark">שעה</th>
                  {WEEKDAYS.map((day) => (
                    <th key={day} className="py-3 px-4 text-sm font-semibold text-brand-primary">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time) => (
                  <tr
                    key={time}
                    className="border-b border-brand-primary-muted/20 last:border-b-0 hover:bg-brand-primary-muted/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-brand-dark/80">{time}</td>
                    {WEEKDAYS.map((day) => {
                      const name = byDay[day]?.[time];
                      return (
                        <td key={day} className="py-3 px-4 text-sm text-brand-dark">
                          {name ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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