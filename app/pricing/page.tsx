import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מחירים ומסלולים | עונג של פילאטיס",
  description: "מגוון אפשרויות למנויים, כרטיסיות ושיעורי ניסיון בסטודיו פילאטיס מכשירים.",
};

export default function PricingPage() {
  const categories = [
    {
      title: "מנויים חודשיים",
      items: [
        { name: "אימון פעם בשבוע", price: "₪290" },
        { name: "2 אימונים בשבוע", price: "₪450" },
        { name: "3 אימונים בשבוע", price: "₪550" },
        { name: "ללא הגבלה", price: "₪650" },
      ],
    },
    {
      title: "כרטיסיה",
      items: [
        { name: "כרטיסיית 10 אימונים", price: "₪750" }
      ],
    },
  ];

  return (
    <main className="max-w-2xl mx-auto px-6 py-20 text-center">
      <h1 className="hero-title mb-12">מחירון ומסלולים</h1>

      {categories.map((category, idx) => (
        <div key={idx} className="mb-16 text-right">
          <div className="mb-6 text-sm tracking-[0.25em] uppercase text-brand-primary-muted">
            {category.title}
          </div>

          <div className="space-y-4">
            {category.items.map((item, itemIdx) => (
              <button
                key={itemIdx}
                className="flex w-full items-center group border-b border-brand-primary/10 py-6 transition-all hover:bg-white/30"
              >
                {/* Price - serif, subtle */}
                <div className="w-24 text-right font-serif text-2xl text-brand-primary">
                  {item.price}
                </div>

                {/* Plan name - airy, light */}
                <div className="flex-1 px-8 text-right">
                  <span className="text-lg font-light tracking-wide text-brand-dark group-hover:text-brand-primary transition-colors">
                    {item.name}
                  </span>
                </div>

                {/* Minimal icon */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-accent">
                  <span className="text-xl">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <footer className="mt-16 pt-8 border-t border-brand-primary-muted/20 text-sm text-brand-primary-muted space-y-2 text-right">
        <p>• המנויים הינם בהוראת קבע ללא תפיסת מסגרת אשראי</p>
        <p>• ביטול מנוי בהודעה של 30 יום מראש</p>
        <p>• הכרטיסיות תקפות לשימוש בטווח של חודשיים מיום הרכישה</p>
      </footer>
    </main>
  );
}