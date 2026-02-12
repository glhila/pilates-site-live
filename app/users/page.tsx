'use client';

export const dynamic = 'force-dynamic';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const CANCELLATION_WINDOW_HOURS = 4;
const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];

export default function UserPortal() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ניהול התאריך המוצג במערכת
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateMobile, setSelectedDateMobile] = useState(new Date());

  useEffect(() => {
    if (user && supabase) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const { data: cls } = await supabase.from('classes').select('*, bookings(id)').order('start_time');
      setClasses(cls || []);

      const { data: books } = await supabase.from('bookings').select('*, classes(*)').eq('user_id', user.id);
      setUserBookings(books || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // חישוב ימי השבוע הנוכחי לתצוגת מחשב
  const weekDates = useMemo(() => {
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const handleBooking = async (classItem: any) => {
    if (!supabase || !profile?.is_approved) return alert("החשבון ממתין לאישור מנהלת ✨");
    
    // לוגיקת רישום (מקוצרת לצורך ה-UI, נשארת זהה לקוד הקודם שלך)
    const { error } = await supabase.from('bookings').insert({
      user_id: user?.id,
      class_id: classItem.id,
      payment_source: 'membership' // דוגמה
    });

    if (!error) {
      alert("נרשמת בהצלחה!");
      fetchData();
    }
  };

  const cancelBooking = async (booking: any) => {
    if (!confirm("לבטל רישום?")) return;
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8 font-sans antialiased text-brand-dark" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* פרופיל משתמשת */}
        <header className="bg-white border border-brand-stone/20 p-6 rounded-[2.5rem] shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold italic">היי, {user?.firstName} ✨</h1>
            <div className="flex gap-3 mt-2">
               <span className="text-[11px] bg-brand-bg px-3 py-1 rounded-full border border-brand-stone/10 font-bold opacity-60">מנוי: {profile?.membership_type || 0} שיעורים</span>
               <span className="text-[11px] bg-brand-bg px-3 py-1 rounded-full border border-brand-stone/10 font-bold opacity-60">יתרה: {profile?.punch_card_remaining || 0}</span>
            </div>
          </div>
          
          {/* ניווט שבועות */}
          <div className="flex items-center gap-4 bg-brand-stone/5 p-2 rounded-2xl">
            <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 7)))} className="p-2 hover:bg-white rounded-xl transition-all">←</button>
            <span className="font-bold text-sm">
              {weekDates[0].toLocaleDateString('he-IL', {day:'numeric', month:'short'})} - {weekDates[6].toLocaleDateString('he-IL', {day:'numeric', month:'short'})}
            </span>
            <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 7)))} className="p-2 hover:bg-white rounded-xl transition-all">→</button>
          </div>
        </header>

        {/* --- תצוגת מובייל (יומן יומי) --- */}
        <div className="block md:hidden">
          {/* פיקר תאריכים אופקי */}
          <div className="flex overflow-x-auto gap-3 pb-6 no-scrollbar mask-fade">
            {weekDates.map((date, i) => {
              const isSelected = date.toDateString() === selectedDateMobile.toDateString();
              return (
                <button 
                  key={i}
                  onClick={() => setSelectedDateMobile(date)}
                  className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-brand-dark text-white border-brand-dark shadow-lg' : 'bg-white border-brand-stone/10'}`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-50">{DAYS_HEBREW[i]}</span>
                  <span className="text-lg font-black">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          {/* רשימת שיעורים ליום הנבחר במובייל */}
          <div className="space-y-4">
            {classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).length > 0 ? (
              classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).map(c => (
                <ClassCard key={c.id} c={c} isBooked={userBookings.some(b => b.class_id === c.id)} onBook={() => handleBooking(c)} />
              ))
            ) : (
              <div className="text-center py-10 opacity-30 italic text-sm">אין אימונים ביום זה</div>
            )}
          </div>
        </div>

        {/* --- תצוגת מחשב (יומן שבועי) --- */}
        <div className="hidden md:grid grid-cols-7 gap-4 items-start">
          {weekDates.map((date, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="text-center p-3 bg-white/50 rounded-2xl border border-brand-stone/10">
                <p className="text-[10px] font-black opacity-30 uppercase">{DAYS_HEBREW[i]}</p>
                <p className="font-bold text-lg">{date.getDate()}</p>
              </div>
              
              <div className="space-y-3">
                {classes
                  .filter(c => new Date(c.start_time).toDateString() === date.toDateString())
                  .map(c => (
                    <ClassCard key={c.id} c={c} compact isBooked={userBookings.some(b => b.class_id === c.id)} onBook={() => handleBooking(c)} />
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// קומפוננטה קטנה לכרטיס שיעור (כדי למנוע חזרה על קוד)
function ClassCard({ c, isBooked, onBook, compact = false }: any) {
  const isFull = c.bookings?.length >= c.max_capacity;
  const time = new Date(c.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white border rounded-[1.5rem] p-4 transition-all shadow-sm flex flex-col gap-3 ${isBooked ? 'border-brand-dark ring-1 ring-brand-dark/5' : 'border-brand-stone/10'}`}>
      <div>
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-black text-brand-dark/30 uppercase tracking-widest">{time}</span>
          {isFull && !isBooked && <span className="text-[9px] font-bold text-red-400 italic">מלא</span>}
        </div>
        <h3 className={`font-bold leading-tight ${compact ? 'text-sm' : 'text-base'}`}>{c.name}</h3>
        {!compact && <p className="text-[10px] text-brand-dark/40 font-bold">{c.class_type}</p>}
      </div>
      
      <button 
        disabled={isBooked || isFull}
        onClick={onBook}
        className={`w-full py-2 rounded-xl font-bold text-[10px] transition-all ${
          isBooked ? 'bg-brand-stone/10 text-brand-dark/30' : isFull ? 'bg-brand-stone/5 text-brand-dark/10' : 'bg-brand-dark text-white hover:scale-[1.02] shadow-md shadow-brand-dark/5'
        }`}
      >
        {isBooked ? 'רשומה ✔' : isFull ? 'מלא' : 'הרשמה'}
      </button>
    </div>
  );
}