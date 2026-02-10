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
    <main className="max-w-2xl mx-auto px-6 py-20 text-center font-sans">
      <h1 className="text-4xl md:text-5xl font-serif text-brand-primary mb-16">מחירון ומסלולים</h1>

      {categories.map((category, idx) => (
        <div key={idx} className="mb-16">
          {/* כותרת קטגוריה - מעוצבת לפי שפת המותג */}
          <div className="inline-block bg-brand-primary text-white text-lg font-medium px-10 py-2 rounded-full mb-8 shadow-sm">
            {category.title}
          </div>

          <div className="space-y-4">
            {category.items.map((item, itemIdx) => (
              <button 
                key={itemIdx} 
                className="flex items-stretch w-full group transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* מחיר - צד שמאל */}
                <div className="bg-brand-primary text-white w-24 py-4 flex items-center justify-center rounded-r-2xl font-semibold border-l border-white/10">
                  {item.price}
                </div>
                
                {/* שם המסלול + טקסט הנעה לפעולה - צד ימין */}
                <div className="bg-brand-bg-soft text-brand-dark flex-1 py-4 px-8 flex items-center justify-between mr-1 rounded-l-2xl font-medium transition-colors group-hover:bg-brand-primary-muted/20">
                  <span className="text-lg">{item.name}</span>
                  
                  <span className="text-sm text-brand-primary font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    רכישה מהירה ←
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* הערות שוליים בשפה עדינה */}
      <footer className="mt-16 pt-8 border-t border-brand-primary-muted/20 text-sm text-brand-primary-muted space-y-2">
        <p>• המנויים הינם בהוראת קבע ללא תפיסת מסגרת אשראי</p>
        <p>• ביטול מנוי בהודעה של 30 יום מראש</p>
        <p>• הכרטיסיות תקפות לשימוש בטווח של חודשיים מיום הרכישה</p>
      </footer>
    </main>
  );
}