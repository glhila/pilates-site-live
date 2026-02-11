import { Metadata } from "next";

export const metadata: Metadata = {
  title: "צור קשר | עונג של פילאטיס ",
  description: "צרו איתנו קשר לתיאום שיעור ניסיון בכפר סבא. כתובת, טלפון ושעות פעילות.",
};

export default function ContactPage() {
  return (
    <main id="main-content" className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-brand-dark">דברי איתנו</h1>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6 text-lg text-brand-dark/80">
          <p>📍 <strong>כתובת:</strong> רחוב [שם הרחוב], כפר סבא </p>
          <p>📞 <strong>טלפון:</strong> 052-640-9993 </p>
          <p>📧 <strong>אימייל:</strong> oneg@studio.com</p>
          <div className="pt-8">
             <h3 className="font-bold mb-2">שעות פעילות:</h3>
             <p>א'-ה': 07:00 - 21:00</p>
             <p>ו': 07:00 - 14:00</p>
          </div>
        </div>
        <div className="bg-brand-soft/10 h-64 rounded-2xl flex items-center justify-center italic text-brand-soft">
          [כאן ניתן להטמיע מפה של Google Maps]
        </div>
      </div>
    </main>
  );
}