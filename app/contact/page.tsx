import { Metadata } from "next";
import { SERVICE_PHONE, SERVICE_EMAIL, getWhatsAppLink, STUDIO_ADDRESS, GOOGLE_MAPS_EMBED_URL, WAZE_NAVIGATION_URL } from "@/src/lib/constants";
import { WhatsAppIcon, WazeIcon } from "@/src/components/icons";

export const metadata: Metadata = {
  title: "צור קשר | העונג שבפילאטיס",
  description: "צרו איתנו קשר לתיאום שיעור ניסיון בסטודיו עונג של פילאטיס בכפר סבא. כתובת, טלפון ושעות פעילות.",
};

export default function ContactPage() {
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
          <div className="feature-card space-y-12">
            <section>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.3em] text-brand-accent-text mb-6">פרטי התקשרות</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-serif text-lg text-brand-primary">הסטודיו שלנו</p>
                    <p className="font-light text-brand-primary/70">{STUDIO_ADDRESS}</p>
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
                    <a href={`mailto:${SERVICE_EMAIL}`} className="font-light text-brand-primary/70 hover:text-brand-accent-text transition-colors">
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
                  <p>09:00 - 17:00</p>
                </div>
                <div>
                  <p className="font-bold mb-1">יום ו׳</p>
                  <p>09:00 - 13:00</p>
                </div>
              </div>
            </section>

            <div className="pt-6">
              <a
                href={contactWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-luxury w-full flex items-center justify-center gap-3"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                שלחי לנו הודעה ב-WhatsApp
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative w-full min-h-[280px] aspect-[4/3] max-h-[420px] lg:max-h-none lg:min-h-[400px] rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-brand-stone/20 shadow-2xl bg-brand-bg-soft">
              <iframe
                title={`מפה: ${STUDIO_ADDRESS}`}
                src={GOOGLE_MAPS_EMBED_URL}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="flex justify-center">
              <a
                href={WAZE_NAVIGATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-widest uppercase border border-brand-stone/40 px-5 py-3 rounded-full inline-flex items-center gap-2 hover:border-brand-accent-text hover:text-brand-accent-text transition-colors"
              >
                <WazeIcon className="w-4 h-4 shrink-0" />
                Navigate with Waze
              </a>
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