'use client';
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CANCELLATION_WINDOW_HOURS = 4; // זמן ביטול מוגדר מראש

export const dynamic = 'force-dynamic';

export default function UserPortal() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // משיכת פרופיל
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    setProfile(prof);

    // משיכת שיעורים קרובים (7 ימים)
    const today = new Date();
    const { data: cls } = await supabase.from('classes').select('*, bookings(id)').gte('start_time', today.toISOString()).order('start_time');
    setClasses(cls || []);

    // משיכת רישומים של המשתמשת כולל פרטי השיעור
    const { data: books } = await supabase.from('bookings').select('*, classes(*)').eq('user_id', user?.id);
    setUserBookings(books || []);
    setLoading(false);
  };

  const getWeekRange = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const handleBooking = async (classItem: any) => {
    if (!profile?.is_approved) return alert("החשבון ממתין לאישור המנהלת.");
    if (userBookings.some(b => b.class_id === classItem.id)) return alert("את כבר רשומה לשיעור זה.");
    if (classItem.bookings.length >= classItem.max_capacity) return alert("השיעור מלא.");

    const { start, end } = getWeekRange();
    const classDate = new Date(classItem.start_time);
    let paymentSource = 'membership';
    let shouldDeductPunch = false;

    // בדיקת מכסה שבועית במידה והשיעור בשבוע הנוכחי
    if (classDate >= start && classDate <= end && profile.membership_type > 0) {
      const bookingsThisWeek = userBookings.filter(b => {
        const d = new Date(b.classes?.start_time);
        return d >= start && d <= end;
      }).length;

      if (bookingsThisWeek >= profile.membership_type) {
        if (profile.punch_card_remaining > 0) {
          paymentSource = 'punch_card';
          shouldDeductPunch = true;
        } else {
          return alert(`ניצלת את המכסה השבועית שלך (${profile.membership_type} שיעורים).`);
        }
      }
    } else if (profile.membership_type === 0) {
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
      alert("נרשמת בהצלחה!");
      fetchData();
    }
  };

  const cancelBooking = async (booking: any) => {
    const classStartTime = new Date(booking.classes.start_time);
    const diffInHours = (classStartTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    let shouldRefund = true;

    if (diffInHours < CANCELLATION_WINDOW_HOURS) {
      if (!confirm(`ביטול מאוחר: נותרו פחות מ-${CANCELLATION_WINDOW_HOURS} שעות. האימון ינוכה מהמכסה. לבטל?`)) return;
      shouldRefund = false;
    } else {
      if (!confirm("לבטל את הרישום?")) return;
    }

    const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
    if (!error && shouldRefund && booking.payment_source === 'punch_card') {
      await supabase.from('profiles').update({ punch_card_remaining: profile.punch_card_remaining + 1 }).eq('id', user?.id);
    }
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center italic opacity-50">טוען נתונים...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans pb-20" dir="rtl">
      <header className="max-w-4xl mx-auto mb-10 bg-card border border-border p-8 rounded-[2rem] shadow-sm">
        <h1 className="text-3xl font-black mb-1">היי, {user?.firstName} 👋</h1>
        <div className="flex gap-6 mt-4">
          <p className="text-sm">מנוי: <strong>{profile?.membership_type} שיעורים/שבוע</strong></p>
          <p className="text-sm">יתרה בכרטיסייה: <strong>{profile?.punch_card_remaining || 0}</strong></p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* אימונים קרובים */}
        {userBookings.filter(b => new Date(b.classes.start_time) >= new Date()).length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">האימונים הקרובים שלי</h2>
            <div className="grid gap-3">
              {userBookings.filter(b => new Date(b.classes.start_time) >= new Date()).map(b => (
                <div key={b.id} className="bg-foreground text-background p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{b.classes.name}</h3>
                    <p className="text-xs opacity-70">
                      {new Date(b.classes.start_time).toLocaleString('he-IL', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => cancelBooking(b)} className="text-xs border border-background/20 px-4 py-2 rounded-full hover:bg-background/10">ביטול</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* מערכת שעות כללית */}
        <section>
          <h2 className="text-xl font-bold mb-4">מערכת שעות להרשמה</h2>
          <div className="grid gap-3">
            {classes.map(c => {
              const isBooked = userBookings.some(b => b.class_id === c.id);
              const isFull = c.bookings.length >= c.max_capacity;
              return (
                <div key={c.id} className={`bg-card border p-5 rounded-2xl flex justify-between items-center ${isBooked ? 'border-primary/50' : ''}`}>
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase">{c.class_type}</span>
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-xs opacity-60">{new Date(c.start_time).toLocaleString('he-IL', { weekday: 'long', day:'numeric', month:'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button 
                    disabled={isBooked || isFull}
                    onClick={() => handleBooking(c)}
                    className={`px-6 py-2 rounded-full font-bold text-xs ${isBooked ? 'bg-muted text-muted-foreground' : isFull ? 'bg-gray-100 text-gray-400' : 'bg-foreground text-background'}`}
                  >
                    {isBooked ? 'רשומה' : isFull ? 'מלא' : 'הרשמה'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}