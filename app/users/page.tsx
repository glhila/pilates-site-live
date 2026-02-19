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

// הגדרות לוח השעות
const HOUR_HEIGHT = 100; // גובה שעה בפיקסלים
const MORNING_START = 7;
const MORNING_END = 13;
const EVENING_START = 16;
const EVENING_END = 22;

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  'break', // הפסקת צהריים
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

// פונקציית עזר לבדיקה אם שני תאריכים הם באותו שבוע (ראשון-שבת)
const isSameWeek = (date1: Date, date2: Date) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff1 = d1.getDate() - d1.getDay();
  const diff2 = d2.getDate() - d2.getDay();
  const week1 = new Date(d1.setDate(diff1)).toDateString();
  const week2 = new Date(d2.setDate(diff2)).toDateString();
  return week1 === week2;
};

export default function UserPortal() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewDate, setViewDate] = useState(new Date()); // ניווט שבועי
  const [selectedDateMobile, setSelectedDateMobile] = useState(new Date()); // יום נבחר במובייל

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
      // 1. שליפת שיעורים
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

      // 3. שליפת הזמנות עם נתוני השיעור לחישוב שבועי
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
        return alert(`ניתן לבטל עד ${CANCELLATION_WINDOW_HOURS} שעות לפני תחילת השיעור.`);
    }

    if (!confirm("לבטל את הרישום לשיעור?")) return;
    const { error } = await supabaseClient.from('bookings').delete().eq('id', bookingId);
    
    if (!error) {
      if (paymentSource === 'punch_card') {
         await supabaseClient.from('profiles').update({ 
           punch_card_remaining: (profile.punch_card_remaining || 0) + 1 
         }).eq('id', profile.id);
      }
      alert("הרישום בוטל בהצלחה");
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

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center font-bold text-brand-dark/20 italic">
      טוען נתונים...
    </div>
  );

  return (
    <main
      id="main-content"
      className="min-h-screen bg-brand-bg font-sans antialiased text-brand-dark"
      dir="rtl"
    >
      <div className="container mx-auto px-6 py-20 max-w-6xl">
        
       {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8 bg-white p-8 rounded-[3rem] shadow-sm border border-brand-stone/20">
          <div className="space-y-4 text-center lg:text-right">
            <span className="mb-2 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
              Your Practice • Member Portal
            </span>
            <h1 className="hero-title text-3xl sm:text-4xl text-brand-primary">
              היי, <span className="luxury-italic text-brand-accent-text">{profile?.full_name || user?.firstName}</span>
            </h1>
            <p className="max-w-md text-sm font-light text-brand-primary/70 italic mx-auto lg:mx-0">
              כאן תוכלי לצפות במערכת, לנהל את ההרשמות שלך ולהרגיש שהכל מסודר ונעים.
            </p>
          </div>

          {/* Membership + Punch Card Info */}
          <div className="flex flex-row gap-2 bg-brand-stone/5 p-3 rounded-[2.5rem] border border-brand-stone/10 shadow-inner">
            {/* Membership type pill */}
            <div className="px-6 py-2 rounded-3xl text-[11px] font-bold uppercase tracking-widest text-brand-dark bg-white shadow-sm text-center">
              מנוי: {profile?.membership_type || 0} בשבוע
            </div>

            {/* Punch card details — two rows */}
            <div
              className={`flex flex-col rounded-3xl border overflow-hidden text-[11px] font-bold uppercase tracking-widest ${
                profile?.punch_card_remaining > 0
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}
            >
              <div className="px-6 py-2 text-center">
                יתרת ניקובים: {profile?.punch_card_remaining || 0}
              </div>
              <div className={`border-t px-6 py-2 text-center ${
                profile?.punch_card_remaining > 0 ? 'border-green-100' : 'border-red-100'
              }`}>
                בתוקף עד: {profile?.punch_card_expiry || '—'}
              </div>
            </div>
          </div>

          {/* Week navigator */}
          <div className="flex items-center gap-4 bg-brand-stone/5 p-3 rounded-3xl border border-brand-stone/10">
            <button
              onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 7); setViewDate(d); }}
              className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold"
              aria-label="שבוע קודם"
            >
              →
            </button>
            <span className="font-bold text-sm min-w-[150px] text-center tabular-nums">
              {weekDates[0].toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })} -{' '}
              {weekDates[6].toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
            </span>
            <button
              onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 7); setViewDate(d); }}
              className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold"
              aria-label="שבוע הבא"
            >
              ←
            </button>
          </div>
        </header>

        {/* Desktop View: Interactive Time Grid */}
        <section className="hidden md:flex bg-white rounded-[3.5rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[950px]">
          
          {/* Time Sidebar */}
          <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-20 text-[10px] opacity-50 font-serif italic font-black tabular-nums">
            {TIME_SLOTS.map((slot, i) => (
              <div key={i} className={slot === 'break' ? 'h-16 bg-brand-stone/10' : 'h-[100px] flex justify-center items-start tracking-tighter'}>
                {slot !== 'break' && slot}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {weekDates.map((date, dayIdx) => (
              <div key={dayIdx} className={`relative border-l border-brand-stone/5 last:border-l-0 ${date.toDateString() === new Date().toDateString() ? 'bg-brand-dark/[0.02]' : ''}`}>
                <div className="h-20 flex flex-col items-center justify-center border-b border-brand-stone/10 bg-white sticky top-0 z-20">
                  <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{DAYS_HEBREW[dayIdx]}</span>
                  <span className="text-xl font-bold mt-0.5">{date.getDate()}</span>
                </div>
                
                {/* Scrollable/Relative area for classes */}
                <div className="relative" style={{ height: 'calc(14 * 100px + 64px)' }}>
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
                        topPos = (hour - EVENING_START + mins/60) * HOUR_HEIGHT + (7 * HOUR_HEIGHT) + 64;
                      } else return null;

                      return (
                        <div
                          key={c.id}
                          className="absolute inset-x-2 h-[88px] z-10 transition-transform hover:scale-[1.02]"
                          style={{ top: `${topPos}px` }}
                        >
                          <ClassCard
                            c={c}
                            booking={booking}
                            onBook={() => handleBooking(c)}
                            onCancel={() =>
                              handleCancel(booking.id, c.start_time, booking.payment_source)
                            }
                            compact
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile View: Selection + List */}
        <section className="block md:hidden">
          <div className="flex overflow-x-auto gap-3 pb-8 no-scrollbar px-1">
            {weekDates.map((date, i) => {
              const isSelected = date.toDateString() === selectedDateMobile.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <button 
                  key={i} 
                  onClick={() => setSelectedDateMobile(date)} 
                  className={`flex-shrink-0 w-16 h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-brand-dark text-white border-brand-dark shadow-xl scale-105' : 'bg-white border-brand-stone/10'} ${isToday && !isSelected ? 'ring-2 ring-brand-dark/20' : ''}`}
                >
                  <span className={`text-[10px] font-bold uppercase ${isSelected ? 'opacity-70' : 'opacity-40'}`}>{DAYS_HEBREW[i]}</span>
                  <span className="text-2xl font-black mt-1">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-5 pb-24">
            <h3 className="font-bold text-xl px-2">שיעורים ליום {selectedDateMobile.toLocaleDateString('he-IL', {weekday: 'long'})}</h3>
            {classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).length > 0 ? (
              classes
                .filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString())
                .map(c => {
                    const booking = userBookings.find(b => b.class_id === c.id);
                    return <ClassCard key={c.id} c={c} booking={booking} onBook={() => handleBooking(c)} onCancel={() => handleCancel(booking.id, c.start_time, booking.payment_source)} />;
                })
            ) : (
              <div className="text-center py-24 opacity-30 italic text-sm bg-white/50 rounded-[2.5rem] border border-dashed border-brand-stone/30">
                אין אימונים מתוכננים ליום זה 🧘‍♀️
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

function ClassCard({ c, booking, onBook, onCancel, compact = false }: any) {
  const isBooked = !!booking;
  const count = c.bookings ? c.bookings.length : 0;
  const isFull = count >= c.max_capacity;
  const time = new Date(c.start_time).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`relative flex h-full flex-col justify-between rounded-[1.6rem] border overflow-hidden transition-all group ${
        isBooked
          ? 'bg-brand-accent/8 border-brand-accent/40'
          : 'bg-brand-bg-soft/90 border-brand-stone/30 hover:bg-white'
      }`}
    >
      {isBooked && (
        <div className="absolute top-2 left-3 rounded-full bg-brand-accent-text px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
          ✓
        </div>
      )}

      <div className="px-3 pt-3 pb-1 sm:px-4 sm:pt-3 sm:pb-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="rounded-full bg-brand-bg-soft px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-primary">
            {time}
          </span>
          {!isBooked && (
            <span
              className={`tabular-nums text-[10px] font-semibold ${
                isFull ? 'text-red-400' : 'text-brand-stone'
              }`}
            >
              {count}/{c.max_capacity}
            </span>
          )}
        </div>
        <h3
          className={`leading-tight tracking-tight text-brand-primary line-clamp-2 ${
            compact ? 'text-[13px] font-semibold' : 'text-[15px] sm:text-base font-serif'
          }`}
        >
          {c.name}
        </h3>
        {!compact && (
          <p className="mt-1 text-[11px] font-light text-brand-primary/70 line-clamp-1">
            {c.class_type}
          </p>
        )}
      </div>

      <div className="px-3 pb-2 sm:px-4 sm:pb-3">
        {isBooked ? (
          <button
            onClick={onCancel}
            className="w-full rounded-2xl border border-brand-accent/30 bg-white/90 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent-text hover:bg-brand-accent/5 transition-all"
          >
            ביטול רישום ✕
          </button>
        ) : (
          <button
            disabled={isFull}
            onClick={onBook}
            className={`w-full rounded-2xl py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm ${
              isFull
                ? 'bg-brand-stone/5 text-brand-stone/40 cursor-not-allowed'
                : 'bg-brand-dark text-white hover:bg-brand-dark/90 hover:scale-[1.01]'
            }`}
          >
            {isFull ? 'רשימת המתנה' : 'הרשמה לאימון'}
          </button>
        )}
      </div>
    </div>
  );
}