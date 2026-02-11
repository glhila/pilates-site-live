import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "מחירון ומסלולים | עונג פילאטיס",
  description: "מגוון אפשרויות למנויים וכרטיסיות בסטודיו עונג פילאטיס. השקעה בגוף ובנפש באווירה יוקרתית.",
};

export default function PricingPage() {
  const categories = [
    {
      title: "מנויים חודשיים",
      subtitle: "התמדה היא המפתח לשינוי אמיתי",
      items: [
        { name: "אימון פעם בשבוע", price: "₪290", detail: "4 אימונים בחודש" },
        { name: "2 אימונים בשבוע", price: "₪450", detail: "8 אימונים בחודש" },
        { name: "3 אימונים בשבוע", price: "₪550", detail: "12 אימונים בחודש" },
        { name: "ללא הגבלה", price: "₪650", detail: "על בסיס מקום פנוי" },
      ],
    },
    {
      title: "כרטיסיות",
      subtitle: "גמישות מקסימלית לאורח החיים שלך",
      items: [
        { name: "כרטיסיית 10 אימונים", price: "₪750", detail: "תקפה לחודשיים" }
      ],
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg">
      <div className="container mx-auto px-6 py-20 max-w-3xl">
        
        {/* Header Section */}
        <header className="mb-24 text-center">
          <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
            Invest in Yourself • Balance & Flow
          </span>
          <h1 className="hero-title mb-4">
            מחירון <span className="luxury-italic text-brand-accent-text">ומסלולים</span>
          </h1>
          <p className="max-w-xl mx-auto font-light text-brand-primary/70 italic">
            בחרי את המסלול הנכון עבורך והתחילי את המסע לחיבור עמוק לגוף.
          </p>
        </header>

        {/* Pricing Categories */}
        <div className="space-y-24">
          {categories.map((category, idx) => (
            <section key={idx} className="reveal">
              <div className="mb-10 text-right">
                {/* תיקון 1: הגדלת כותרת הקטגוריה */}
                <h2 className="text-xl sm:text-2xl font-serif text-brand-primary mb-1">
                  {category.title}
                </h2>
                <p className="text-sm tracking-widest uppercase text-brand-accent-text font-medium">
                  {category.subtitle}
                </p>
              </div>

              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="group flex items-center justify-between border-b border-brand-stone/30 py-8 transition-all hover:pr-4"
                  >
                    {/* Price Side */}
                    <div className="text-left">
                      <div className="font-serif text-3xl text-brand-primary">
                        {item.price}
                      </div>
                    </div>

                    {/* Name & Detail Side */}
                    <div className="text-right">
                      <h3 className="text-xl font-light tracking-wide text-brand-dark group-hover:text-brand-accent-text transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-brand-stone uppercase tracking-widest mt-1">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Small Print / Terms - תיקון 2: יישור לימין */}
        <footer className="mt-24 p-10 rounded-[2.5rem] bg-brand-bg-soft/50 border border-brand-stone/20">
          <h4 className="font-serif italic text-brand-primary mb-8 text-2xl text-right">דגשים חשובים</h4>
          <ul className="space-y-6 text-base font-light text-brand-primary/90 text-right">
            <li className="flex items-center justify-start gap-3 flex-row-reverse">
              <span className="text-brand-accent-text text-lg">◦</span>
              <span>המנויים הינם בהוראת קבע ללא תפיסת מסגרת אשראי</span>
            </li>
            <li className="flex items-center justify-start gap-3 flex-row-reverse">
              <span className="text-brand-accent-text text-lg">◦</span>
              <span>ביטול מנוי בהודעה של 30 יום מראש</span>
            </li>
            <li className="flex items-center justify-start gap-3 flex-row-reverse">
              <span className="text-brand-accent-text text-lg">◦</span>
              <span>הכרטיסיות תקפות לשימוש בטווח של חודשיים מיום הרכישה</span>
            </li>
          </ul>
          
          <div className="mt-14 text-center">
            <Link href="/contact" className="btn-luxury">
              להרשמה ותיאום שיעור
            </Link>
          </div>
        </footer>

        {/* Final Branding */}
        <div className="mt-20 text-center opacity-30">
           <p className="text-[10px] uppercase tracking-[0.5em] text-brand-primary">
             Oneg Pilates Studio
           </p>
        </div>
      </div>
    </main>
  );
}