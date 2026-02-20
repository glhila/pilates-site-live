import { Metadata } from "next";
import Link from "next/link";
import { SERVICE_PHONE, SERVICE_EMAIL, getWhatsAppLink } from "@/src/lib/constants";

export const metadata: Metadata = {
  title: "צור קשר | עונג של פילאטיס כפר סבא",
  description: "צרו איתנו קשר לתיאום שיעור ניסיון בסטודיו עונג של פילאטיס בכפר סבא. כתובת, טלפון ושעות פעילות.",
};

export default function ContactPage() {
  // יצירת לינק לוואטסאפ עם הודעה ייעודית לעמוד צור קשר
  const contactWhatsAppUrl = getWhatsAppLink("היי! הגעתי דרך האתר ואשמח לקבל פרטים נוספים על הסטודיו 🧘‍♀️✨");

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg">
      <div className="container mx-auto px-6 py-20 max-w-6xl">
        
        {/* Header Section */}
        <header className="mb-20 text-center">
          <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
            Get in Touch • Start Your Journey
          </span>
          <h1 className="hero-title mb-4">
            דברי <span className="luxury-italic text-brand-accent-text">איתנו</span>
          </h1>
          <p className="max-w-xl mx-auto font-light text-brand-primary/70 italic">
            אנחנו כאן לכל שאלה, תיאום שיעור היכרות או פשוט כדי לדבר על תנועה.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Contact Details Card */}
          <div className="feature-card space-y-12">
            <section>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.3em] text-brand-accent-text mb-6">פרטי התקשרות</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-serif text-lg text-brand-primary">הסטודיו שלנו</p>
                    <p className="font-light text-brand-primary/70">רחוב [שם הרחוב], כפר סבא</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <span className="text-xl">📞</span>
                  <div>
                    <p className="font-serif text-lg text-brand-primary">דברי איתנו</p>
                    <a href={`tel:${SERVICE_PHONE}`} className="font-light text-brand-primary/70 hover:text-brand-accent-text transition-colors tabular-nums">
                      {SERVICE_PHONE}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="font-serif text-lg text-brand-primary">כתבי לנו</p>
                    <a href= {`mailto:${SERVICE_EMAIL}`} className="font-light text-brand-primary/70 hover:text-brand-accent-text transition-colors">
                      {SERVICE_EMAIL}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-8 border-t border-brand-stone/30">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.3em] text-brand-accent-text mb-6">שעות פעילות</h2>
              <div className="grid grid-cols-2 gap-4 text-sm font-light text-brand-primary/80">
                <div>
                  <p className="font-bold mb-1">א׳ - ה׳</p>
                  <p>07:00 - 21:00</p>
                </div>
                <div>
                  <p className="font-bold mb-1">יום ו׳</p>
                  <p>07:00 - 14:00</p>
                </div>
              </div>
            </section>

            <div className="pt-6">
              <a 
                href={contactWhatsAppUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-luxury w-full text-center block"
              >
                שלחי לנו הודעה ב-WhatsApp
              </a>
            </div>
          </div>

          {/* Map Section */}
          <div className="relative h-full min-h-[400px] lg:min-h-[600px] rounded-[3rem] overflow-hidden border border-brand-stone/20 shadow-2xl">
            <div className="absolute inset-0 bg-brand-bg-soft flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full border border-brand-stone/30 flex items-center justify-center mb-6">
                <span className="text-2xl opacity-50">📍</span>
              </div>
              <p className="font-serif italic text-brand-primary/60 text-xl mb-4">Finding Balance</p>
              <p className="text-xs tracking-widest text-brand-stone uppercase">Map coming soon</p>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-stone">
            Inspired by movement • Designed for you
          </p>
        </footer>
      </div>
    </main>
  );
}