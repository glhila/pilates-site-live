import { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "הצהרת נגישות | עונג של פילאטיס",
  description: "הצהרת הנגישות של סטודיו עונג של פילאטיס - פירוט התאמות הנגישות שבוצעו באתר לטובת גלישה נוחה לכלל האוכלוסייה.",
};

export default function AccessibilityPage() {
  // ─── Derived ────────────────────────────────────────────────────────────
  const lastUpdated = "פברואר 2026";

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg pb-20">
      <div className="container mx-auto px-6 py-16 max-w-4xl">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">הצהרת נגישות</h1>
          <p className="text-brand-taupe italic">אנחנו מאמינים בשוויון הזדמנויות ובנגישות דיגיטלית לכולן</p>
        </header>

        {/* ─── Content: intro, status, adjustments, contact, last updated ─── */}
        <article className="prose prose-stone lg:prose-lg mx-auto text-brand-dark leading-relaxed space-y-8 text-right">

          <section>
            <h2 className="text-2xl font-bold mb-4 border-b border-brand-stone pb-2">מבוא</h2>
            <p>
              סטודיו "עונג של פילאטיס" רואה חשיבות עליונה במתן שירות שוויוני ומכבד לכלל הלקוחות והגולשות. 
              אנו משקיעים מאמצים ומשאבים רבים בהנגשת האתר על מנת לאפשר לאנשים עם מוגבלות חוויית גלישה נוחה, 
              יעילה ועצמאית, מתוך אמונה כי לכל אדם מגיעה הזכות לחיות בכבוד, בשוויון ובנוחות.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 border-b border-brand-stone pb-2">סטטוס נגישות האתר</h2>
            <p>
              אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.
              התאמות הנגישות בוצעו על פי המלצות התקן הישראלי (ת"י 5568) לנגישות תכנים באינטרנט ברמת AA 
              ומסמך WCAG2.1 הבינלאומי.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 pr-4">
              <li>האתר מותאם לתצוגה בדפדפנים הנפוצים ולשימוש בטלפון הסלולרי.</li>
              <li>האתר מותאם לגלישה באמצעות המקלדת בלבד.</li>
              <li>האתר תומך בתוכנות קורא מסך (NVDA, Jaws ועוד).</li>
              <li>האתר כולל רכיב נגישות המאפשר שינוי ניגודיות, הגדלת פונט ועצירת אנימציות.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 border-b border-brand-stone pb-2">התאמות שבוצעו בפועל</h2>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li><strong>ניווט מקלדת:</strong> ניתן לנווט באתר באמצעות מקשי ה-Tab וה-Arrows.</li>
              <li><strong>חלופות טקסטואליות:</strong> לתמונות באתר הוספו תיאורי טקסט (Alt text) לטובת לקויות ראייה.</li>
              <li><strong>היררכיה סמנטית:</strong> השימוש בכותרות (H1-H6) ובמבנה HTML סמנטי בוצע בהתאם להיררכיית התוכן.</li>
              <li><strong>ניגודיות:</strong> הצבעים באתר נבחרו תוך הקפדה על ניגודיות העומדת בתקן.</li>
              <li><strong>טפסים:</strong> לכל שדה בטופס הוספו תוויות ברורות (Labels).</li>
            </ul>
          </section>

          <section className="bg-brand-bg-soft p-8 rounded-3xl border border-brand-stone">
            <h2 className="text-2xl font-bold mb-4">נתקלת בבעיה? דברי איתנו</h2>
            <p className="mb-6">
              למרות מאמצינו להנגיש את כלל הדפים באתר, ייתכן שיתגלו חלקים שטרם הונגשו במלואם או שאינם נגישים טכנולוגית (כמו מפות חיצוניות או סרטונים). 
              אם נתקלת בקושי, נשמח לשמוע ממך ולתקן בהקדם.
            </p>
            <div className="space-y-2 font-medium">
              <p><strong>רכזת נגישות:</strong> עונג גריז-ממן </p>
              <p><strong>טלפון:</strong> 052-640-9993</p>
              <p><strong>אימייל:</strong> oneg@studio.com </p>
            </div>
          </section>

          <p className="text-sm text-brand-taupe pt-8">
            הצהרה זו עודכנה לאחרונה בתאריך: {lastUpdated}
          </p>

        </article>
      </div>
    </main>
  );
}