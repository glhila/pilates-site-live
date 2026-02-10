import { Metadata } from "next";

export const metadata: Metadata = {
  title: "אודות הסטודיו | עונג של פילאטיס",
  description: "הכירו את הצוות והחזון של סטודיו פילאטיס מכשירים המקצועי ביותר בכפר סבא.",
};

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-brand-dark">הסיפור שלנו</h1>
      <div className="prose lg:prose-xl text-brand-dark/80 leading-relaxed">
        <p className="mb-6">
          הסטודיו שלנו הוקם מתוך תשוקה לתנועה ודיוק. אנחנו מאמינים שפילאטיס מכשירים הוא לא רק אימון, אלא דרך חיים...
        </p>
        <h2 className="text-2xl font-semibold mt-12 mb-4">קצת עליי</h2>
        <p>כאן תוכלי להציג את הניסיון המקצועי שלך.</p>
      </div>
    </main>
  );
}