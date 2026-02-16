'use client';

export const dynamic = 'force-dynamic';

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// קבועים להגדרות הלוח
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const CANCELLATION_WINDOW_HOURS = 4;
const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];

// טווחי השעות להצגה בלוח
const MORNING_START = 7;
const MORNING_END = 13;
const EVENING_START = 16;
const EVENING_END = 22;
const HOUR_HEIGHT = 90; // גובה בפיקסלים לכל שעה בלוח

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  'break', // הפסקה בצהריים
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

// פונקציית עזר לבדיקה אם שני תאריכים הם באותו שבוע (ראשון עד שבת)
const isSameWeek = (date1: Date, date2: Date) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff1 = d1.getDate() - d1.getDay();
  const diff2 = d2.getDate() - d2.getDay();
  return new Date(d1.setDate(diff1)).toDateString() === new Date(d2.setDate(diff2)).toDateString();
};

export default function UserPortal() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewDate, setViewDate] = useState(new Date()); // לניווט שבועי
  const [selectedDateMobile, setSelectedDateMobile] = useState(new Date()); // ליום נבחר במובייל

  const getAuthenticatedSupabase = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return null;
      return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } catch (e) {
      console.error("Auth error:", e);
      return null;
    }
  };

  const syncAndFetchData = async () => {
    const supabaseClient = await getAuthenticatedSupabase();
    if (!supabaseClient || !user) {
        setLoading(false);
        return;
    }

    try {
      // 1. שליפת שיעורים (עם התיקון לכפילות קשרים שדיברנו עליה)
      const { data: cls } = await supabaseClient
        .from('classes')
        .select('*, bookings!class_id(id)')
        .order('start_time');
      setClasses(cls || []);

      // 2. סנכרון ושליפת פרופיל
      await supabaseClient.rpc('sync_user_profile');
      const { data: myProfile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();
      setProfile(myProfile);

      // 3. שליפת הזמנות המשתמשת יחד עם נתוני השיעור (לצורך חישוב שבועי)
      if (myProfile) {
        const { data: books } = await supabaseClient
          .from('bookings')
          .select('*, classes!class_id(start_time)')
          .eq('user_id', myProfile.id);
        setUserBookings(books || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) syncAndFetchData();
  }, [isLoaded, user]);

  const handleBooking = async (classItem: any) => {
    const supabaseClient = await getAuthenticatedSupabase();
    if (!supabaseClient || !profile) return alert("שגיאת התחברות");
    if (!profile.is_approved) return alert("החשבון ממתין לאישור מנהלת ✨");

    // אכיפת הגבלת מנוי שבועי
    if (profile.membership_type > 0) {
      const classDate = new Date(classItem.start_time);
      const bookingsThisWeek = userBookings.filter(b => 
        b.classes && isSameWeek(new Date(b.classes.start_time), classDate)
      );

      if (bookingsThisWeek.length >= profile.membership_type) {
        return alert(`ניצלת כבר את כל ${profile.membership_type} האימונים שלך לשבוע זה! ✨`);
      }
    }

    if (classItem.bookings && classItem.bookings.length >= classItem.max_capacity) {
        return alert("השיעור מלא 😔");
    }

    const paymentSource = profile.membership_type > 0 ? 'membership' : 'punch_card';
    if (paymentSource === 'punch_card' && profile.punch_card_remaining <= 0) {
        return alert("נגמרו הניקובים בכרטיסייה!");
    }

    if (confirm(`להירשם לשיעור ${classItem.name}?`)) {
        const { error } = await supabaseClient.from('bookings').insert({
            user_id: profile.id,
            class_id: classItem.id,
            payment_source: paymentSource
        });

        if (error) return alert("שגיאה ברישום: " + error.message);

        if (paymentSource === 'punch_card') {
            await supabaseClient.from('profiles').update({
                punch_card_remaining: profile.punch_card_remaining - 1
            }).eq('id', profile.id);
        }

        alert("נרשמת בהצלחה! 💪");
        syncAndFetchData();
    }
  };

  const handleCancel = async (bookingId: string, classDate: string, paymentSource: string) => {
    const supabaseClient = await getAuthenticatedSupabase();
    if (!supabaseClient) return;

    const hoursDiff = (new Date(classDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursDiff < CANCELLATION_WINDOW_HOURS) {
        return alert(`ביטול אפשרי עד ${CANCELLATION_WINDOW_HOURS} שעות לפני השיעור.`);
    }

    if (!confirm("לבטל את הרישום?")) return;
    const { error } = await supabaseClient.from('bookings').delete().eq('id', bookingId);
    
    if (!error) {
      if (paymentSource === 'punch_card') {
         await supabaseClient.from('profiles').update({ 
           punch_card_remaining: (profile.punch_card_remaining || 0) + 1 
         }).eq('id', profile.id);
      }
      alert("הרישום בוטל");
      syncAndFetchData();
    }
  };

  const weekDates = useMemo(() => {
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewDate]);

  if (!isLoaded || loading) return <div className="min-h-screen flex items-center justify-center font-bold text-brand-dark/20 italic">טוען נתונים...</div>;

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8 font-sans antialiased text-brand-dark" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="bg-white border border-brand-stone/20 p-6 rounded-[2.5rem] shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-right">
            <h1 className="text-2xl font-extrabold italic">היי, {profile?.full_name || user?.firstName} ✨</h1>
            <div className="flex gap-3 mt-2 justify-center md:justify-start">
                <span className="text-[11px] bg-brand-stone/5 px-3 py-1 rounded-full border border-brand-stone/10 font-bold">מנוי: {profile?.membership_type || 0} בשבוע</span>
                <span className={`text-[11px] px-3 py-1 rounded-full border font-bold ${profile?.punch_card_remaining > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>יתרת ניקובים: {profile?.punch_card_remaining || 0}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-brand-stone/5 p-2 rounded-2xl">
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} className="p-2 hover:bg-white rounded-xl transition-all">←</button>
            <span className="font-bold text-sm w-40 text-center tabular-nums">
              {weekDates[0].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})} - {weekDates[6].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})}
            </span>
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} className="p-2 hover:bg-white rounded-xl transition-all">→</button>
          </div>
        </header>

        {/* Desktop View: Time Grid */}
        <div className="hidden md:flex bg-white rounded-[2.5rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[800px]">
          {/* עמודת שעות */}
          <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-16">
            {TIME_SLOTS.map((slot, i) => (
              <div key={i} className={`flex items-start justify-center text-[10px] font-black opacity-20 ${slot === 'break' ? 'h-12 bg-brand-stone/10' : 'h-[90px]'}`}>
                {slot !== 'break' && slot}
              </div>
            ))}
          </div>

          {/* עמודות ימים */}
          <div className="flex-1 grid grid-cols-7 relative">
            {weekDates.map((date, dayIdx) => (
              <div key={dayIdx} className={`relative border-l border-brand-stone/5 last:border-l-0 ${date.toDateString() === new Date().toDateString() ? 'bg-brand-dark/[0.02]' : ''}`}>
                <div className="h-16 flex flex-col items-center justify-center border-b border-brand-stone/5">
                    <span className="text-[10px] font-black opacity-30 uppercase">{DAYS_HEBREW[dayIdx]}</span>
                    <span className="font-bold">{date.getDate()}</span>
                </div>
                
                {/* שטח הצבת השיעורים */}
                <div className="relative" style={{ height: 'calc(14 * 90px + 48px)' }}>
                  {classes
                    .filter(c => new Date(c.start_time).toDateString() === date.toDateString())
                    .map(c => {
                      const booking = userBookings.find(b => b.class_id === c.id);
                      const startTime = new Date(c.start_time);
                      const hour = startTime.getHours();
                      const mins = startTime.getMinutes();

                      let topPos = 0;
                      if (hour >= MORNING_START && hour <= MORNING_END) {
                        topPos = (hour - MORNING_START + mins/60) * HOUR_HEIGHT;
                      } else if (hour >= EVENING_START && hour <= EVENING_END) {
                        topPos = (hour - EVENING_START + mins/60) * HOUR_HEIGHT + (7 * HOUR_HEIGHT) + 48;
                      } else return null;

                      return (
                        <div key={c.id} className="absolute inset-x-1.5" style={{ top: `${topPos}px` }}>
                          <ClassCard c={c} booking={booking} onBook={() => handleBooking(c)} onCancel={() => handleCancel(booking.id, c.start_time, booking.payment_source)} compact />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View: Vertical List */}
        <div className="block md:hidden">
          <div className="flex overflow-x-auto gap-3 pb-6 no-scrollbar px-1">
            {weekDates.map((date, i) => {
              const isSelected = date.toDateString() === selectedDateMobile.toDateString();
              return (
                <button key={i} onClick={() => setSelectedDateMobile(date)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-brand-dark text-white border-brand-dark shadow-lg' : 'bg-white border-brand-stone/10'}`}>
                  <span className={`text-[10px] font-bold ${isSelected ? 'opacity-70' : 'opacity-40'}`}>{DAYS_HEBREW[i]}</span>
                  <span className="text-xl font-black mt-1">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 pb-20">
            <h3 className="font-bold text-lg px-2">אימונים ליום {selectedDateMobile.toLocaleDateString('he-IL', {weekday: 'long'})}</h3>
            {classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).length > 0 ? (
              classes
                .filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString())
                .map(c => {
                    const booking = userBookings.find(b => b.class_id === c.id);
                    return <ClassCard key={c.id} c={c} booking={booking} onBook={() => handleBooking(c)} onCancel={() => handleCancel(booking.id, c.start_time, booking.payment_source)} />;
                })
            ) : (
              <div className="text-center py-16 opacity-30 italic text-sm bg-white/50 rounded-3xl border border-dashed border-brand-stone/20">אין אימונים ביום זה 🧘‍♀️</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function ClassCard({ c, booking, onBook, onCancel, compact = false }: any) {
  const isBooked = !!booking;
  const count = c.bookings ? c.bookings.length : 0;
  const isFull = count >= c.max_capacity;
  const time = new Date(c.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`border rounded-[1.5rem] p-3 transition-all shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md ${isBooked ? 'bg-green-50 border-green-200 ring-1 ring-green-100' : 'bg-white border-brand-stone/10'}`}>
      {isBooked && <div className="absolute top-0 left-0 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg">רשומה ✓</div>}
      <div className="mt-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-brand-dark/40 bg-brand-bg px-2 py-0.5 rounded-md">{time}</span>
          {!isBooked && <span className={`text-[9px] font-bold ${isFull ? 'text-red-400' : 'text-brand-dark/20'}`}>{count}/{c.max_capacity}</span>}
        </div>
        <h3 className={`font-bold leading-tight mt-1 ${compact ? 'text-[13px]' : 'text-base'}`}>{c.name}</h3>
      </div>
      
      {isBooked ? (
          <button onClick={onCancel} className="w-full py-1.5 rounded-xl font-bold text-[10px] bg-white border border-red-100 text-red-400 hover:bg-red-50">ביטול ✕</button>
      ) : (
          <button disabled={isFull} onClick={onBook} className={`w-full py-1.5 rounded-xl font-bold text-[10px] transition-all ${isFull ? 'bg-brand-stone/5 text-brand-dark/20 cursor-not-allowed' : 'bg-brand-dark text-white shadow-md'}`}>{isFull ? 'מלא' : 'הרשמה'}</button>
      )}
    </div>
  );
}