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
  const SERVICE_PHONE = "0526409993"; 

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg text-right" dir="rtl">
      <div className="container mx-auto px-6 py-20 max-w-3xl">
        
        {/* Header - מרכוז רק כאן למעלה */}
        <header className="mb-24 text-center">
          <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
            Invest in Yourself • Balance & Flow
          </span>
          <h1 className="hero-title mb-4 text-brand-primary">
            מחירון <span className="luxury-italic text-brand-accent-text">ומסלולים</span>
          </h1>
          <p className="max-w-xl mx-auto font-light text-brand-primary/70 italic">
            בחרי את המסלול הנכון עבורך והתחילי את המסע לחיבור עמוק לגוף.
          </p>
        </header>

        <div className="space-y-32">
          {categories.map((category, idx) => (
            <section key={idx} className="reveal text-right">
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-serif text-brand-primary mb-2 leading-none">
                  {category.title}
                </h2>
                <p className="text-sm tracking-[0.2em] uppercase text-brand-accent-text font-bold">
                  {category.subtitle}
                </p>
              </div>

              <div className="space-y-2">
                {category.items.map((item, itemIdx) => {
                  // יצירת הודעה מותאמת אישית לכל מסלול
                  const waMsg = encodeURIComponent(
                    `היי! אני מתעניינת במסלול "${item.name}" שראיתי באתר, אשמח לפרטים נוספים ✨`
                  );
                  const waLink = `https://wa.me/${SERVICE_PHONE.replace(/\D/g, '').replace(/^0/, '972')}?text=${waMsg}`;

                  return (
                    <div
                      key={itemIdx}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-stone/40 py-8 transition-all hover:bg-white/20 gap-4 sm:gap-0"
                    >
                      {/* צד ימין: שם המנוי ופירוט */}
                      <div className="text-right">
                        <h3 className="text-xl md:text-2xl font-light tracking-wide text-brand-dark group-hover:text-brand-accent-text transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-brand-primary/50 uppercase tracking-widest mt-1">
                          {item.detail}
                        </p>
                      </div>

                      {/* צד שמאל: מחיר וכפתור וואטסאפ */}
                      <div className="flex items-center gap-6 mr-auto sm:mr-0 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left font-serif text-2xl md:text-3xl text-brand-primary">
                          {item.price}
                        </div>
                        
                        <a 
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center w-10 h-10 rounded-full border border-brand-stone/30 text-brand-dark hover:bg-brand-dark hover:text-white hover:border-brand-dark transition-all duration-300 shadow-sm"
                          title="הצטרפות דרך הWhatsApp"
                        >
                          <span className="text-lg">💬</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* תיבת דגשים - יישור ימין מוחלט */}
        <footer className="mt-32 p-8 md:p-12 rounded-[3rem] bg-brand-bg-soft/60 border border-brand-stone/30">
          <div className="max-w-md mr-0 ml-auto"> {/* מבטיח שהתוכן בתוך התיבה ייצמד לימין */}
            <h4 className="font-serif italic text-brand-primary mb-8 text-2xl text-right">דגשים חשובים</h4>
            <ul className="space-y-6 text-right">
              <li className="flex items-start gap-4 text-base font-light text-brand-primary/90">
                <span className="text-brand-accent-text text-xl leading-none mt-1">◦</span>
                <span className="leading-relaxed">המנויים הינם בהוראת קבע ללא תפיסת מסגרת אשראי</span>
              </li>
              <li className="flex items-start gap-4 text-base font-light text-brand-primary/90">
                <span className="text-brand-accent-text text-xl leading-none mt-1">◦</span>
                <span className="leading-relaxed">ביטול מנוי בהודעה של 30 יום מראש</span>
              </li>
              <li className="flex items-start gap-4 text-base font-light text-brand-primary/90">
                <span className="text-brand-accent-text text-xl leading-none mt-1">◦</span>
                <span className="leading-relaxed">הכרטיסיות תקפות לשימוש בטווח של חודשיים מיום הרכישה</span>
              </li>
            </ul>
          </div>
          
          <div className="mt-16 text-center">
            <Link href="/contact" className="btn-luxury">
              להרשמה ותיאום שיעור
            </Link>
          </div>
        </footer>

        {/* Brand Sign-off */}
        <div className="mt-24 text-center opacity-20">
           <p className="text-[9px] uppercase tracking-[0.6em] text-brand-primary">
             Handcrafted Wellness • Pilates Studio
           </p>
        </div>
      </div>
    </main>
  );
}