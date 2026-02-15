'use client';

export const dynamic = 'force-dynamic';

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// הגדרת לקוח Supabase בסיסי (ללא הרשאות מיוחדות בהתחלה)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const CANCELLATION_WINDOW_HOURS = 4;
const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];

export default function UserPortal() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // שימוש בפונקציה לקבלת הטוקן המאובטח
  
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ניהול תאריכים
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateMobile, setSelectedDateMobile] = useState(new Date());

  // פונקציית עזר ליצירת קליינט מאובטח
  const getAuthenticatedSupabase = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      console.log("My JWT Token:", token);
      console.log("Full Auth Header:", `Bearer ${token}`);
      if (!token) {
          console.error("Failed to get Supabase token");
          return null;
      }
      return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } catch (e) {
      console.error("Auth error:", e);
      return null;
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      syncAndFetchData();
    }
  }, [isLoaded, user]);

  const syncAndFetchData = async () => {
    // 1. קבלת קליינט מאובטח
    const supabaseClient = await getAuthenticatedSupabase();
    
    // אם המשתמש לא מחובר או אין טוקן - עצור
    if (!supabaseClient || !user) {
        setLoading(false);
        return;
    }

    try {
      // --- התיקון הגדול ---
      // קריאה לפונקציה שיצרנו ב-SQL שמבצעת את החיבור בשרת
      const { error: rpcError } = await supabaseClient.rpc('sync_user_profile');
      
      if (rpcError) {
          console.error("Sync error:", rpcError);
      } else {
          console.log("Profile synced successfully via Server!");
      }
      // --------------------

      // כעת, כשהחיבור בוצע, אפשר למשוך את הנתונים כרגיל
      // ה-RLS יאפשר לנו לראות את הפרופיל כי ה-clerk_id כבר מעודכן
      const { data: myProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('clerk_id', user.id) // חיפוש לפי ה-ID שלי
        .single();

      if (profileError) console.error("Error fetching profile:", profileError);
      
      setProfile(myProfile);

      // טעינת שאר הנתונים
      if (myProfile) {
        const { data: cls } = await supabaseClient.from('classes').select('*, bookings(id)').order('start_time');
        setClasses(cls || []);

        const { data: books } = await supabaseClient.from('bookings').select('*').filter('user_id', 'eq', myProfile.id);
        setUserBookings(books || []);
      } else {
        // מצב שבו אין פרופיל בכלל (משתמשת שלא הוזמנה ע"י האדמין)
        console.log("No profile found for this user.");
      }

    } catch (err) {
      console.error("Critical error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (classItem: any) => {
    const supabaseClient = await getAuthenticatedSupabase();
    if (!supabaseClient || !profile) return alert("שגיאת התחברות או פרופיל חסר");
    if (!profile.is_approved) return alert("החשבון ממתין לאישור מנהלת ✨");

    if (classItem.bookings && classItem.bookings.length >= classItem.max_capacity) {
        return alert("השיעור מלא 😔");
    }

    const hasMembership = profile.membership_type > 0;
    const hasPunches = profile.punch_card_remaining > 0;

    if (!hasMembership && !hasPunches) {
        return alert("נגמרו הניקובים בכרטיסייה! אנא רכשי כרטיסייה חדשה.");
    }
    
    let paymentSource = 'membership';
    if (!hasMembership && hasPunches) paymentSource = 'punch_card';

    if (confirm(`להירשם לשיעור ${classItem.name}?`)) {
        const { error: bookingError } = await supabaseClient.from('bookings').insert({
            user_id: profile.id,
            class_id: classItem.id,
            payment_source: paymentSource
        });

        if (bookingError) return alert("שגיאה ברישום: " + bookingError.message);

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

    const classTime = new Date(classDate).getTime();
    const now = new Date().getTime();
    const hoursDiff = (classTime - now) / (1000 * 60 * 60);

    if (hoursDiff < CANCELLATION_WINDOW_HOURS) {
        return alert(`ניתן לבטל שיעור עד ${CANCELLATION_WINDOW_HOURS} שעות לפני תחילתו.`);
    }

    if (!confirm("האם לבטל את הרישום לשיעור?")) return;

    const { error } = await supabaseClient.from('bookings').delete().eq('id', bookingId);
    
    if (!error) {
      if (paymentSource === 'punch_card') {
         await supabaseClient.from('profiles').update({ 
           punch_card_remaining: (profile?.punch_card_remaining || 0) + 1 
         }).eq('id', profile.id);
         alert("הרישום בוטל והניקוב הוחזר לכרטיסייה.");
      } else {
         alert("הרישום בוטל בהצלחה.");
      }
      syncAndFetchData();
    } else {
        alert("שגיאה בביטול: " + error.message);
    }
  };

  // --- UI Components remain mostly the same ---
  
  const weekDates = useMemo(() => {
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const getUserBooking = (classId: string) => {
      return userBookings.find(b => b.class_id === classId);
  };

  if (!isLoaded || loading) return <div className="min-h-screen flex items-center justify-center text-brand-dark/50 font-bold">טוען נתונים...</div>;

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8 font-sans antialiased text-brand-dark" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        <header className="bg-white border border-brand-stone/20 p-6 rounded-[2.5rem] shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-right">
            <h1 className="text-2xl font-extrabold italic">היי, {profile?.full_name || user?.firstName || 'מתאמנת'} ✨</h1>
            
            {!profile ? (
                 <p className="text-red-500 font-bold text-sm mt-1">מנוי לא פעיל - פני לצוות הסטודיו</p>
            ) : (
                <div className="flex gap-3 mt-2 justify-center md:justify-start">
                    {profile.membership_type > 0 && (
                        <span className="text-[11px] bg-brand-stone/5 px-3 py-1 rounded-full border border-brand-stone/10 font-bold text-brand-dark/70">
                            מנוי: {profile.membership_type} בשבוע
                        </span>
                    )}
                    <span className={`text-[11px] px-3 py-1 rounded-full border font-bold ${profile.punch_card_remaining > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        יתרת ניקובים: {profile.punch_card_remaining}
                    </span>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 bg-brand-stone/5 p-2 rounded-2xl">
            <button onClick={() => {
                const newDate = new Date(viewDate);
                newDate.setDate(newDate.getDate() - 7);
                setViewDate(newDate);
            }} className="p-2 hover:bg-white rounded-xl transition-all w-8 h-8 flex items-center justify-center">←</button>
            <span className="font-bold text-sm w-32 text-center tabular-nums">
              {weekDates[0].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})} - {weekDates[6].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})}
            </span>
            <button onClick={() => {
                const newDate = new Date(viewDate);
                newDate.setDate(newDate.getDate() + 7);
                setViewDate(newDate);
            }} className="p-2 hover:bg-white rounded-xl transition-all w-8 h-8 flex items-center justify-center">→</button>
          </div>
        </header>

        <div className="block md:hidden">
          <div className="flex overflow-x-auto gap-3 pb-6 no-scrollbar mask-fade px-1">
            {weekDates.map((date, i) => {
              const isSelected = date.toDateString() === selectedDateMobile.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <button 
                  key={i}
                  onClick={() => setSelectedDateMobile(date)}
                  className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-brand-dark text-white border-brand-dark shadow-lg scale-105' : 'bg-white border-brand-stone/10'} ${isToday && !isSelected ? 'border-brand-dark/30' : ''}`}
                >
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
                    const booking = getUserBooking(c.id);
                    return (
                        <ClassCard 
                            key={c.id} 
                            c={c} 
                            booking={booking}
                            onBook={() => handleBooking(c)} 
                            onCancel={() => handleCancel(booking.id, c.start_time, booking.payment_source)}
                        />
                    );
                })
            ) : (
              <div className="text-center py-10 opacity-30 italic text-sm bg-white/50 rounded-3xl border border-dashed border-brand-stone/20 mx-2">
                  אין אימונים ביום זה 🧘‍♀️
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-7 gap-4 items-start">
          {weekDates.map((date, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className={`text-center p-3 rounded-2xl border ${date.toDateString() === new Date().toDateString() ? 'bg-brand-dark text-white border-brand-dark shadow-md' : 'bg-white/50 border-brand-stone/10'}`}>
                <p className={`text-[10px] font-black uppercase ${date.toDateString() === new Date().toDateString() ? 'opacity-70' : 'opacity-30'}`}>{DAYS_HEBREW[i]}</p>
                <p className="font-bold text-lg">{date.getDate()}</p>
              </div>
              
              <div className="space-y-3">
                {classes
                  .filter(c => new Date(c.start_time).toDateString() === date.toDateString())
                  .map(c => {
                    const booking = getUserBooking(c.id);
                    return (
                        <ClassCard 
                            key={c.id} 
                            c={c} 
                            compact 
                            booking={booking}
                            onBook={() => handleBooking(c)}
                            onCancel={() => handleCancel(booking.id, c.start_time, booking.payment_source)}
                        />
                    );
                  })
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClassCard({ c, booking, onBook, onCancel, compact = false }: any) {
  const isBooked = !!booking;
  const currentBookingsCount = c.bookings ? c.bookings.length : 0;
  const isFull = currentBookingsCount >= c.max_capacity;
  const time = new Date(c.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  let statusColor = "bg-white border-brand-stone/10";
  if (isBooked) statusColor = "bg-green-50 border-green-200 ring-1 ring-green-100";
  else if (isFull) statusColor = "bg-brand-stone/5 border-brand-stone/10 grayscale opacity-80";

  return (
    <div className={`border rounded-[1.5rem] p-4 transition-all shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:shadow-md ${statusColor}`}>
      {isBooked && <div className="absolute top-0 left-0 bg-green-500 text-white text-[9px] font-bold px-2 py-1 rounded-br-lg">רשומה ✓</div>}
      <div className="mt-1">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-black text-brand-dark/40 uppercase tracking-widest bg-brand-bg px-2 py-0.5 rounded-md">{time}</span>
          {!isBooked && isFull && <span className="text-[9px] font-bold text-red-400 italic">מלא</span>}
          {!isBooked && !isFull && <span className="text-[9px] font-bold text-brand-dark/20">{currentBookingsCount}/{c.max_capacity}</span>}
        </div>
        <h3 className={`font-bold leading-tight mt-2 ${compact ? 'text-sm' : 'text-base'}`}>{c.name}</h3>
        {!compact && <p className="text-[11px] text-brand-dark/50 font-medium mt-0.5">{c.class_type}</p>}
      </div>
      
      {isBooked ? (
          <button onClick={onCancel} className="w-full py-2 rounded-xl font-bold text-[10px] transition-all bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600">ביטול רישום ✕</button>
      ) : (
          <button disabled={isFull} onClick={onBook} className={`w-full py-2 rounded-xl font-bold text-[10px] transition-all ${isFull ? 'bg-transparent text-brand-dark/20 cursor-not-allowed' : 'bg-brand-dark text-white hover:bg-brand-dark/90 shadow-md shadow-brand-dark/10'}`}>{isFull ? 'רשימת המתנה' : 'הרשמה לאימון'}</button>
      )}
    </div>
  );
}