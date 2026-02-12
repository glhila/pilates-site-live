'use client';

export const dynamic = 'force-dynamic';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const CANCELLATION_WINDOW_HOURS = 4;

export default function UserPortal() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      const today = new Date().toISOString();
      const { data: cls } = await supabase.from('classes')
        .select('*, bookings(id)')
        .gte('start_time', today)
        .order('start_time', { ascending: true });
      setClasses(cls || []);

      const { data: books } = await supabase.from('bookings').select('*, classes(*)').eq('user_id', user.id);
      setUserBookings(books || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekRangeForDate = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const handleBooking = async (classItem: any) => {
    if (!supabase || !profile) return;
    if (!profile.is_approved) return alert("החשבון ממתין לאישור מנהלת ✨");
    if (classItem.bookings?.length >= classItem.max_capacity) return alert("השיעור מלא.");

    const classDate = new Date(classItem.start_time);
    const { start, end } = getWeekRangeForDate(classDate);
    
    let paymentSource = 'membership';
    let shouldDeductPunch = false;

    const bookingsInThatWeek = userBookings.filter(b => {
      const d = new Date(b.classes?.start_time);
      return d >= start && d <= end;
    }).length;

    if (profile.membership_type > 0) {
      if (bookingsInThatWeek >= profile.membership_type) {
        if (profile.punch_card_remaining > 0) {
          if (!confirm(`ניצלת את המכסה השבועית. להשתמש בכרטיסייה?`)) return;
          paymentSource = 'punch_card';
          shouldDeductPunch = true;
        } else {
          return alert(`ניצלת את המכסה השבועית שלך (${profile.membership_type} שיעורים).`);
        }
      }
    } else {
      if (profile.punch_card_remaining > 0) {
        paymentSource = 'punch_card';
        shouldDeductPunch = true;
      } else {
        return alert("אין יתרה בכרטיסייה.");
      }
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user?.id,
      class_id: classItem.id,
      payment_source: paymentSource
    });

    if (!error) {
      if (shouldDeductPunch) {
        await supabase.from('profiles').update({ punch_card_remaining: profile.punch_card_remaining - 1 }).eq('id', user?.id);
      }
      alert("נתראה בסטודיו! ✨");
      fetchData();
    }
  };

  const cancelBooking = async (booking: any) => {
    if (!supabase) return;
    const classStartTime = new Date(booking.classes.start_time);
    const diffInHours = (classStartTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    let shouldRefund = true;

    if (diffInHours < CANCELLATION_WINDOW_HOURS) {
      if (!confirm(`ביטול מאוחר: האימון ינוכה מהמכסה. לבטל?`)) return;
      shouldRefund = false;
    } else {
      if (!confirm("לבטל רישום?")) return;
    }

    const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
    if (!error) {
      if (shouldRefund && booking.payment_source === 'punch_card') {
        await supabase.from('profiles').update({ punch_card_remaining: profile.punch_card_remaining + 1 }).eq('id', user?.id);
      }
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8 font-sans antialiased text-brand-dark" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Header - תמיד מופיע */}
        <header className="bg-white border border-brand-stone/20 p-8 rounded-[2.5rem] shadow-sm mb-12 relative">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 italic">היי, {user?.firstName || 'אורחת'}</h1>
          
          <div className="flex flex-wrap gap-4 mt-4">
            {loading ? (
              // Skeletons לנתוני הפרופיל
              <>
                <div className="h-10 w-32 bg-brand-stone/5 animate-pulse rounded-2xl"></div>
                <div className="h-10 w-32 bg-brand-stone/5 animate-pulse rounded-2xl"></div>
              </>
            ) : (
              <>
                <div className="bg-brand-bg px-4 py-2 rounded-2xl border border-brand-stone/10">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest">מנוי שבועי</p>
                  <p className="font-bold text-sm">{profile?.membership_type || 0} שיעורים</p>
                </div>
                <div className="bg-brand-bg px-4 py-2 rounded-2xl border border-brand-stone/10">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest">יתרה בכרטיסייה</p>
                  <p className="font-bold text-sm">{profile?.punch_card_remaining || 0} אימונים</p>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="space-y-12">
          
          {/* סקשן אימונים קרובים - מופיע רק אם יש הרשמות או בטעינה */}
          {(loading || userBookings.filter(b => new Date(b.classes?.start_time) >= new Date()).length > 0) && (
            <section className="animate-in fade-in duration-700">
              <h2 className="text-xl font-bold mb-6 italic mr-2 text-brand-dark/80">האימונים הקרובים שלי</h2>
              <div className="grid gap-4">
                {loading ? (
                  <div className="h-24 bg-brand-dark/5 animate-pulse rounded-[2rem]"></div>
                ) : (
                  userBookings.filter(b => new Date(b.classes?.start_time) >= new Date()).map(b => (
                    <div key={b.id} className="bg-brand-dark text-white p-6 rounded-[2rem] flex justify-between items-center shadow-xl shadow-brand-dark/10">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{b.classes?.name}</h3>
                        <p className="text-xs opacity-60 font-medium">
                          {new Date(b.classes?.start_time).toLocaleString('he-IL', { weekday: 'long', day:'numeric', month:'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => cancelBooking(b)} className="text-xs font-bold border border-white/20 px-5 py-2.5 rounded-xl hover:bg-white hover:text-brand-dark transition-all">ביטול</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* סקשן מערכת שעות - תמיד מופיע כשלד */}
          <section className="animate-in fade-in duration-700">
            <h2 className="text-xl font-bold mb-6 italic mr-2 text-brand-dark/80">לו"ז אימונים להרשמה</h2>
            <div className="grid gap-4">
              {loading ? (
                // הצגת 3 ריבועי טעינה
                [1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-white border border-brand-stone/10 rounded-[2rem] animate-pulse"></div>
                ))
              ) : classes.length === 0 ? (
                // מצב ריק
                <div className="p-20 border-2 border-dashed border-brand-stone/20 rounded-[2.5rem] text-center italic text-brand-dark/30">
                  אין כרגע שיעורים פתוחים להרשמה במערכת
                </div>
              ) : (
                // הרשימה האמיתית
                classes.map(c => {
                  const isBooked = userBookings.some(b => b.class_id === c.id);
                  const isFull = c.bookings?.length >= c.max_capacity;
                  return (
                    <div key={c.id} className={`bg-white border p-6 rounded-[2rem] flex justify-between items-center shadow-sm ${isBooked ? 'border-brand-dark ring-1 ring-brand-dark/5' : 'border-brand-stone/10'}`}>
                      <div>
                        <span className="text-[10px] font-black text-brand-dark/30 uppercase tracking-widest">{c.class_type}</span>
                        <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
                        <p className="text-sm text-brand-dark/50 font-medium">
                          {new Date(c.start_time).toLocaleString('he-IL', { weekday: 'long', day:'numeric', month:'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button 
                        disabled={isBooked || isFull}
                        onClick={() => handleBooking(c)}
                        className={`px-8 py-3 rounded-2xl font-bold text-xs transition-all ${
                          isBooked ? 'bg-brand-stone/10 text-brand-dark/30' : isFull ? 'bg-brand-stone/5 text-brand-dark/20' : 'bg-brand-dark text-white shadow-lg active:scale-95'
                        }`}
                      >
                        {isBooked ? 'רשומה ✔' : isFull ? 'מלא' : 'הרשמה'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}