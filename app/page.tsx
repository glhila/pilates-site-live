import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getWhatsAppLink } from "@/src/lib/constants";

export const metadata: Metadata = {
  title: "ראשי | עונג של פילאטיס",
  description: "סטודיו בוטיק לפילאטיס מכשירים באווירה אינטימית ויוקרתית.",
};

export default function Home() {
  const whatsappLink = getWhatsAppLink( "היי! אשמח לקבוע שיעור היכרות בסטודיו 🧘‍♀️✨");

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg">
      {/* Editorial hero */}
      <section className="relative min-h-[90vh] flex items-center px-6 py-20 overflow-hidden">
        <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Image side (במחשב מופיע משמאל, בנייד יורד למטה) */}
          <div className="reveal order-2 lg:order-1 flex justify-center">
            <div className="relative aspect-[4/5] w-full max-w-md">
              {/* אלמנט עיצובי - עיגול רך מאחורי התמונה */}
              <div className="absolute -inset-4 bg-brand-stone/20 rounded-[10rem] rotate-3 blur-2xl" />
              
              <div className="feature-card relative h-full w-full overflow-hidden flex items-center justify-center border-[12px] border-white/50">
                {/* כאן תבוא תמונת אווירה מהסטודיו */}
                <div className="text-center p-8">
                  <span className="font-serif italic text-brand-stone text-lg">
                    Balance & Grace
                  </span>
                </div>
                {/* דוגמה להטמעת תמונה אמיתית:
                <Image 
                  src="/studio-hero.jpg" 
                  alt="סטודיו עונג פילאטיס" 
                  fill 
                  className="object-cover"
                /> 
                */}
              </div>
            </div>
          </div>

          {/* Right: Text side */}
          <div className="reveal order-1 lg:order-2 text-right">
            <span className="mb-6 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
              Mindful Movement • Organic Luxury
            </span>
            
            <h1 className="hero-title mb-8">
              עונג של <br />
              <span className="luxury-italic text-brand-accent-text">פילאטיס</span>
            </h1>
            
            <p className="mb-12 max-w-md text-base leading-relaxed text-brand-primary/80 ml-auto font-light">
              סטודיו בוטיק למכשירים המשלב דיוק תנועתי עם שקט פנימי. 
              בואי לגלות את העוצמה שברוגע, בחיזוק הליבה ובחיבור עמוק לגוף שלך.
            </p>
            
            <div className="flex flex-col sm:flex-row-reverse gap-6">
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-luxury text-center"
              >
                קביעת שיעור היכרות
              </a>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-brand-primary hover:text-brand-accent-text transition-all duration-300"
              >
                לצפייה במערכת השעות
                <span className="text-lg">←</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip - מעוצב כפס מגזיני נקי */}
      <section className="border-y border-brand-stone/30 bg-white/20 backdrop-blur-sm px-6 py-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-around gap-8 text-center">
          <div className="space-y-1">
            <div className="font-serif text-2xl text-brand-primary italic">Professional</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-brand-accent-text font-bold">הדרכה מוסמכת ומדויקת</div>
          </div>
          <div className="h-10 w-px bg-brand-stone/30 hidden md:block" />
          <div className="space-y-1">
            <div className="font-serif text-2xl text-brand-primary italic">Boutique</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-brand-accent-text font-bold">קבוצות קטנות ויחס אישי</div>
          </div>
          <div className="h-10 w-px bg-brand-stone/30 hidden md:block" />
          <div className="space-y-1">
            <div className="font-serif text-2xl text-brand-primary italic">Organic</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-brand-accent-text font-bold">מכשור מגוון ואווירה משפחתית</div>
          </div>
        </div>
      </section>

      {/* Intro section with card */}
      <section className="py-24 px-6 bg-brand-bg-soft/30">
        <div className="container mx-auto max-w-4xl">
          <div className="feature-card text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-serif text-brand-primary">תנועה עדינה, חיזוק עמוק</h2>
            <p className="text-lg font-light leading-relaxed max-w-2xl mx-auto">
              הסטודיו שלנו תוכנן כדי להעניק לך מרחב של שקט בתוך השגרה. 
              כל שיעור הוא הזדמנות לעבוד על הגוף מבלי להעמיס על הנפש, 
              עם מכשור מתקדם וליווי מקצועי צמוד.
            </p>
            <div className="pt-4">
              <Link href="/about" className="text-brand-accent-text font-bold text-xs uppercase tracking-widest border-b border-brand-accent/30 pb-2 hover:border-brand-accent transition-all">
                הסיפור מאחורי עונג ←
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}