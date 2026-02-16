'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth, useUser } from "@clerk/nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// הגדרות עיצוב ולוח שעות
const HOUR_HEIGHT = 100;
const MORNING_START = 7;
const MORNING_END = 13;
const EVENING_START = 16;
const EVENING_END = 22;
const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  'break',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const CLASS_TEMPLATES = [
  "מכשירים - Level 1", "מכשירים - Level 2", "מכשירים - Level 3",
  "מזרן - Level 1", "מזרן - Level 2", "מזרן - Level 3"
];

const ADMIN_EMAILS = ['hilaglazz13@gmail.com', 'newadmin@gmail.com'];


export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  
  // ניהול תאריכים
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateMobile, setSelectedDateMobile] = useState(new Date());

  // מודאלים
  const [deleteModal, setDeleteModal] = useState<{show: boolean, classItem: any} | null>(null);
  const [detailsModal, setDetailsModal] = useState<any | null>(null);

  // טפסי הוספה
  const [classFormData, setClassFormData] = useState({
    name: CLASS_TEMPLATES[0], date: '', hour: '08', minute: '00', max_capacity: 6, is_recurring: false
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    full_name: '', email: '', phone: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: ''
  });

  const [manualBookingUserId, setManualBookingUserId] = useState("");

  const getAuthenticatedSupabase = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return null;
      return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } catch (e) { return null; }
  };

  const loadData = async () => {
    setIsFetching(true);
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) { setIsFetching(false); return; }
    try {
      const { data: cls } = await supabase.from('classes').select('*, bookings!class_id(id, profiles(id, full_name, email))').order('start_time');
      setClasses(cls || []);
      const { data: profs } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
      setProfiles(profs || []);
    } catch (e) { console.error(e); }
    setIsFetching(false);
  };

  useEffect(() => { if (isLoaded && user) loadData(); }, [activeTab, isLoaded, user]);

  // --- לוגיקת שיעורים ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    const fullDateStr = `${classFormData.date}T${classFormData.hour}:${classFormData.minute}:00`;
    const startDate = new Date(fullDateStr);
    const classesToInsert = [];
    const iterations = classFormData.is_recurring ? 52 : 1;
    const recurring_id = classFormData.is_recurring ? crypto.randomUUID() : null;

    for (let i = 0; i < iterations; i++) {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + (i * 7));
        classesToInsert.push({
            name: classFormData.name,
            class_type: classFormData.name.includes("מזרן") ? "פילאטיס מזרן" : "פילאטיס מכשירים",
            start_time: currentStart.toISOString(),
            max_capacity: classFormData.max_capacity,
            recurring_id: recurring_id
        });
    }
    const { error } = await supabase.from('classes').insert(classesToInsert);
    if (error) alert(error.message);
    else { alert("השיעור/ים נוספו בהצלחה!"); loadData(); }
  };

  const processDeletion = async (type: 'single' | 'future') => {
    if (!deleteModal) return;
    const { classItem } = deleteModal;
    const supabase = await getAuthenticatedSupabase();
    let query = supabase!.from('classes').delete();
    if (type === 'single' || !classItem.recurring_id) {
        query = query.eq('id', classItem.id);
    } else {
        query = query.eq('recurring_id', classItem.recurring_id).gte('start_time', classItem.start_time);
    }
    await query;
    setDeleteModal(null);
    loadData();
  };

  const handleManualBooking = async () => {
    if (!manualBookingUserId || !detailsModal) return;
    const supabase = await getAuthenticatedSupabase();
    const selectedUser = profiles.find(p => p.id === manualBookingUserId);
    
    // בדיקת מכסה למנהלת
    const classWeekStart = new Date(detailsModal.start_time);
    classWeekStart.setDate(classWeekStart.getDate() - classWeekStart.getDay());
    const count = classes.filter(c => {
        const d = new Date(c.start_time);
        return d.getDate() - d.getDay() === classWeekStart.getDate() - classWeekStart.getDay() && 
               c.bookings?.some((b: any) => b.profiles?.id === manualBookingUserId);
    }).length;

    if (selectedUser?.membership_type > 0 && count >= selectedUser.membership_type) {
        if (!confirm(`למתאמנת נגמרה המכסה השבועית (${selectedUser.membership_type}). לרשום בכל זאת?`)) return;
    }

    const { error } = await supabase!.from('bookings').insert({
        user_id: manualBookingUserId, class_id: detailsModal.id, payment_source: 'admin_manual'
    });
    if (error) alert(error.message);
    else { setDetailsModal(null); setManualBookingUserId(""); loadData(); }
  };

  const handleRemoveAttendee = async (bookingId: string) => {
    if (!confirm("להסיר מהשיעור?")) return;
    const supabase = await getAuthenticatedSupabase();
    await supabase?.from('bookings').delete().eq('id', bookingId);
    setDetailsModal(null);
    loadData();
  };

  // --- לוגיקת מתאמנות ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    // 1. חישוב תאריך של חודשיים מהיום
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    const twoMonthsFromNow = d.toISOString().split('T')[0];

    let finalExpiryDate = userFormData.punch_card_expiry;

    // 2. לוגיקה חכמה לעדכון תוקף:
    if (editingUserId) {
        // אם אנחנו בעריכה - נבדוק אם הוסיפו ניקובים (המספר בטופס גדול ממה שיש בטבלה)
        const currentProfile = profiles.find(p => p.id === editingUserId);
        const punchesAdded = userFormData.punch_card_remaining > (currentProfile?.punch_card_remaining || 0);
        
        if (punchesAdded) {
            // אם הוסיפו ניקובים - נגדיר תוקף חדש לחודשיים מהיום
            finalExpiryDate = twoMonthsFromNow;
        }
    } else {
        // אם זו מתאמנת חדשה לגמרי ויש לה ניקובים
        if (userFormData.punch_card_remaining > 0) {
            finalExpiryDate = twoMonthsFromNow;
        }
    }

    const payload = { 
        full_name: userFormData.full_name,
        email: userFormData.email.trim().toLowerCase(),
        phone: userFormData.phone,
        membership_type: userFormData.membership_type,
        punch_card_remaining: userFormData.punch_card_remaining,
        punch_card_expiry: finalExpiryDate, // התאריך המעודכן
        updated_at: new Date().toISOString() 
    };
    
    const { error } = editingUserId 
        ? await supabase.from('profiles').update(payload).eq('id', editingUserId)
        : await supabase.from('profiles').insert([{ ...payload, is_approved: true }]);
    
    if (error) {
        alert("שגיאה בשמירה: " + error.message);
    } else {
        alert(editingUserId ? "פרטי המתאמנת עודכנו בהצלחה" : "מתאמנת חדשה נוספה עם כרטיסיה בתוקף לחודשיים");
        setEditingUserId(null); 
        setUserFormData({full_name:'', email:'', phone:'', membership_type:2, punch_card_remaining:0, punch_card_expiry:''}); 
        loadData(); 
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("למחוק מתאמנת לצמיתות?")) return;
    const supabase = await getAuthenticatedSupabase();
    await supabase?.from('profiles').delete().eq('id', id);
    loadData();
  };

  const weekDates = useMemo(() => {
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }, [viewDate]);

  if (isLoaded && !ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress || '')) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center font-bold text-red-500">אין לך הרשאת גישה לדף זה.</div>;
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-10 font-sans text-brand-dark" dir="rtl">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Navigation Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-brand-stone/20">
          <h1 className="text-4xl font-extrabold italic tracking-tight">ניהול הסטודיו ✨</h1>
          <div className="flex bg-brand-stone/5 p-2 rounded-[2.5rem] border border-brand-stone/10 shadow-inner">
            <button onClick={() => setActiveTab('schedule')} className={`px-10 py-3 rounded-3xl font-bold transition-all ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-xl scale-[1.02]' : 'text-brand-dark/50 hover:text-brand-dark'}`}>מערכת שעות</button>
            <button onClick={() => setActiveTab('users')} className={`px-10 py-3 rounded-3xl font-bold transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-xl scale-[1.02]' : 'text-brand-dark/50 hover:text-brand-dark'}`}>ניהול מתאמנות</button>
          </div>
          <div className="flex items-center gap-4 bg-brand-stone/5 p-3 rounded-3xl">
             <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold">→</button>
             <span className="font-bold text-sm min-w-[160px] text-center tabular-nums">{weekDates[0].toLocaleDateString('he-IL')} - {weekDates[6].toLocaleDateString('he-IL')}</span>
             <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold">←</button>
          </div>
        </header>

        {activeTab === 'schedule' ? (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* עמודת טופס - במובייל היא חלק מהזרימה, במחשב היא נדבקת */}
            <div className="w-full lg:col-span-4 bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit lg:sticky lg:top-10 z-20">
              <h2 className="text-2xl font-bold mb-6 sm:mb-10 italic">הוספת שיעור</h2>
              <form onSubmit={handleCreateClass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">סוג ורמה</label>
                  <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold border border-brand-stone/10" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})}>
                    {CLASS_TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">תאריך</label>
                  <input type="date" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={classFormData.date} onChange={e => setClassFormData({...classFormData, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">שעה</label>
                      <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold" value={classFormData.hour} onChange={e => setClassFormData({...classFormData, hour: e.target.value})}>
                          {Array.from({length: 16}, (_, i) => (i + 7).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">דקות</label>
                      <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold" value={classFormData.minute} onChange={e => setClassFormData({...classFormData, minute: e.target.value})}>
                          <option value="00">00</option><option value="30">30</option>
                      </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">קיבולת מקסימלית</label>
                    <input type="number" className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold border border-brand-stone/10" value={classFormData.max_capacity} onChange={e => setClassFormData({...classFormData, max_capacity: parseInt(e.target.value)})} />
                </div>
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-brand-stone/5 rounded-3xl border border-dashed border-brand-stone/20 transition-all hover:bg-brand-stone/10">
                    <input type="checkbox" className="w-6 h-6 accent-brand-dark" checked={classFormData.is_recurring} onChange={e => setClassFormData({...classFormData, is_recurring: e.target.checked})} />
                    <span className="text-sm font-bold">שיעור קבוע לשנה 🗓️</span>
                </label>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.01]">הוספה</button>
              </form>
            </div>

            {/* עמודת התצוגה (לו"ז) */}
            <div className="w-full lg:col-span-8">
                {/* תצוגת דסקטופ (Grid) - מוסתרת במובייל */}
                <div className="hidden lg:flex bg-white rounded-[3.5rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[950px]">
                  <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-20 text-[10px] opacity-20 font-black tabular-nums">
                    {TIME_SLOTS.map((s, i) => <div key={i} className={s==='break' ? 'h-16 bg-brand-stone/10' : 'h-[100px] flex justify-center'}>{s!=='break' && s}</div>)}
                  </div>
                  <div className="flex-1 grid grid-cols-7 relative">
                    {weekDates.map((date, dayIdx) => (
                      <div key={dayIdx} className={`relative border-l border-brand-stone/5 last:border-l-0 ${date.toDateString() === new Date().toDateString() ? 'bg-brand-dark/[0.02]' : ''}`}>
                        <div className="h-20 flex flex-col items-center justify-center border-b border-brand-stone/10 bg-white sticky top-0 z-20">
                            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{DAYS_HEBREW[dayIdx]}</span>
                            <span className="text-xl font-bold mt-0.5">{date.getDate()}</span>
                        </div>

                        <div className="relative" style={{ height: 'calc(14 * 100px + 64px)' }}>
                          {classes.filter(c => new Date(c.start_time).toDateString() === date.toDateString()).map(c => {
                              const start = new Date(c.start_time);
                              const h = start.getHours(); const m = start.getMinutes();
                              let top = h >= 7 && h <= 13 ? (h-7 + m/60)*100 : (h-16 + m/60)*100 + 700 + 64;
                              return (
                                <div key={c.id} onClick={() => setDetailsModal(c)} 
                                  className={`absolute inset-x-1.5 p-3 sm:p-4 bg-brand-bg border rounded-[1.8rem] shadow-sm cursor-pointer z-10 transition-all hover:shadow-md hover:scale-[1.02] ${c.recurring_id ? 'border-brand-dark/20' : 'border-brand-stone/10'}`} 
                                  style={{ top: `${top}px` }}
                                >
                                  {/* כותרת השיעור מחולקת לשתי שורות */}
                                  <div className="flex flex-col mb-3 leading-tight">
                                    {/* שורה 1: סוג השיעור - קטן ועדין */}
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">
                                      {c.class_type}
                                    </span>
                                    {/* שורה 2: הרמה / שם השיעור - גדול ובולט */}
                                    <span className="font-extrabold text-[13px] italic tracking-tight text-brand-dark mt-1">
                                      {c.name.includes(" - ") ? c.name.split(" - ")[1] : c.name}
                                    </span>
                                  </div>

                                  {/* שורת סטטוס וכפתור מחיקה */}
                                  <div className="flex justify-between items-center mt-auto">
                                    <div className="flex flex-col">
                                      <span className="opacity-40 text-[9px] font-black uppercase tracking-tighter">
                                        {c.bookings?.length || 0}/{c.max_capacity} רשומות
                                      </span>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeleteModal({show: true, classItem: c}); }} 
                                      className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                      title="מחיקת שיעור"
                                    >
                                      <span className="text-sm">🗑</span>
                                    </button>
                                  </div>
                                </div>
                              );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* תצוגת מובייל (List) - מוצגת רק בטלפון */}
                <div className="flex lg:hidden flex-col w-full space-y-8">
                    <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar px-1">
                        {weekDates.map((date, i) => (
                            <button key={i} onClick={() => setSelectedDateMobile(date)} className={`flex-shrink-0 w-16 h-24 rounded-[2rem] flex flex-col items-center justify-center border transition-all ${date.toDateString() === selectedDateMobile.toDateString() ? 'bg-brand-dark text-white border-brand-dark shadow-xl scale-105' : 'bg-white border-brand-stone/10'}`}>
                                <span className="text-[10px] font-black uppercase opacity-40">{DAYS_HEBREW[i]}</span>
                                <span className="text-2xl font-black mt-1">{date.getDate()}</span>
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4 px-1">
                      {classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).length > 0 ? (
                          classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).map(c => (
                              <div 
                                  key={c.id} 
                                  onClick={() => setDetailsModal(c)} 
                                  className="bg-white p-6 rounded-[2.5rem] border border-brand-stone/10 flex justify-between items-center shadow-sm w-full transition-all active:scale-[0.98]"
                              >
                                  <div className="flex-1">
                                      {/* בועית זמן */}
                                      <span className="text-[10px] font-black bg-brand-bg px-3 py-1 rounded-full uppercase tracking-widest text-brand-dark/60">
                                          {new Date(c.start_time).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                                      </span>

                                      {/* פירוט שיעור: סוג ורמה בשתי שורות */}
                                      <div className="mt-4 flex flex-col leading-tight">
                                          <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">
                                              {c.class_type}
                                          </span>
                                          <h3 className="font-extrabold text-xl italic tracking-tight text-brand-dark mt-1">
                                              {c.name.includes(" - ") ? c.name.split(" - ")[1] : c.name}
                                          </h3>
                                      </div>
                                  </div>

                                  <div className="text-left flex flex-col items-end gap-5">
                                      {/* מונה רשומות */}
                                      <div className="flex flex-col items-end">
                                          <span className="text-[10px] font-black opacity-30 whitespace-nowrap uppercase tracking-tighter">
                                              {c.bookings?.length || 0}/{c.max_capacity} רשומות
                                          </span>
                                      </div>
                                      
                                      {/* כפתור ביטול מעוצב */}
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); setDeleteModal({show: true, classItem: c}); }} 
                                          className="text-red-400 text-[10px] font-black uppercase underline decoration-red-100 underline-offset-8 tracking-widest transition-colors active:text-red-600"
                                      >
                                          ביטול שיעור 🗑
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-20 opacity-30 italic text-sm bg-white/50 rounded-[2.5rem] border border-dashed border-brand-stone/30">
                              אין אימונים מתוכננים ליום זה 🧘‍♀️
                          </div>
                      )}
                  </div>
                </div>
            </div>
          </div>
        ) : (
          
          /* Users Management Section */
          <div className="grid lg:grid-cols-12 gap-10">
             <div className="lg:col-span-4 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit lg:sticky lg:top-10 z-20">
              <h2 className="text-2xl font-bold mb-10 italic">{editingUserId ? 'עריכת מתאמנת' : 'מתאמנת חדשה'}</h2>
              <form onSubmit={handleSaveUser} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">שם מלא</label>
                    <input type="text" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.full_name} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">אימייל</label>
                    <input type="email" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">מספר טלפון</label>
                  <input type="tel" placeholder="05X-XXXXXXX" className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={userFormData.phone} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">מנוי שבועי</label><input type="number" className="w-full p-4 bg-brand-bg rounded-2xl" value={userFormData.membership_type} onChange={e => setUserFormData({...userFormData, membership_type: parseInt(e.target.value)})} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">ניקובים</label><input type="number" className="w-full p-4 bg-brand-bg rounded-2xl" value={userFormData.punch_card_remaining} onChange={e => setUserFormData({...userFormData, punch_card_remaining: parseInt(e.target.value)})} /></div>
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-2xl transition-all hover:scale-[1.01]">{editingUserId ? 'עדכן פרטים' : 'הוספה למערכת'}</button>
                {editingUserId && <button type="button" onClick={() => { setEditingUserId(null); setUserFormData({full_name:'', email:'',phone:'', membership_type:2, punch_card_remaining:0, punch_card_expiry:''}); }} className="w-full text-xs font-bold opacity-30 mt-4 underline underline-offset-4 tracking-widest">ביטול עריכה</button>}
              </form>
            </div>

            <div className="lg:col-span-8 space-y-4">
                
                {/* Desktop Users Table */}
                <div className="hidden md:block bg-white rounded-[3rem] shadow-sm border border-brand-stone/20 overflow-hidden w-full">
                  <table className="w-full text-right border-collapse table-auto">
                      <thead>
                          <tr className="bg-brand-stone/5 border-b border-brand-stone/10 text-[10px] font-black opacity-40 uppercase tracking-widest">
                              <th className="p-6 w-[20%]">שם המתאמנת</th>
                              <th className="p-6 w-[25%]">אימייל</th>
                              <th className="p-6 w-[15%]">טלפון</th>
                              <th className="p-6 w-[15%] text-center">מנוי שבועי</th>
                              <th className="p-6 w-[15%] text-center">כרטיסייה</th>
                              <th className="p-6 w-[10%] text-center">פעולות</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm font-medium">
                          {profiles.map(p => (
                              <tr key={p.id} className="border-b border-brand-stone/5 hover:bg-brand-bg/40 transition-colors group">
                                  <td className="p-6">
                                      <p className="font-bold text-lg text-brand-dark leading-tight">{p.full_name}</p>
                                  </td>
                                  <td className="p-6">
                                      <p className="text-xs opacity-50 tabular-nums break-all max-w-[200px]">{p.email}</p>
                                  </td>
                                  <td className="p-6">
                                      {p.phone ? (
                                          <div className="flex items-center gap-2 group-hover:scale-105 transition-transform origin-right">
                                              <span className="tabular-nums font-bold text-brand-dark/70 text-xs">{p.phone}</span>
                                              <a 
                                                  href={`https://wa.me/${p.phone.replace(/\D/g, '').replace(/^0/, '972')}`} 
                                                  target="_blank" 
                                                  rel="noreferrer"
                                                  className="w-7 h-7 flex items-center justify-center bg-green-50 text-green-600 rounded-full hover:bg-green-100 border border-green-100 shadow-sm"
                                                  title="שלחי הודעה"
                                              >
                                                  <span className="text-sm">📱</span>
                                              </a>
                                          </div>
                                      ) : (
                                          <span className="opacity-20 text-[10px] italic">לא הוזן</span>
                                      )}
                                  </td>
                                  <td className="p-6 text-center">
                                      <div className="inline-block px-3 py-1 bg-brand-stone/5 rounded-lg font-bold text-xs text-brand-dark/60">
                                          {p.membership_type} אימונים
                                      </div>
                                  </td>
                                  <td className="p-6 text-center">
                                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap ${p.punch_card_remaining > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                          {p.punch_card_remaining} ניקובים
                                      </span>
                                  </td>
                                  <td className="p-6">
                                      <div className="flex gap-4 justify-center items-center">
                                          <button 
                                              onClick={() => { setEditingUserId(p.id); setUserFormData(p); }} 
                                              className="font-black opacity-30 hover:opacity-100 hover:text-brand-dark transition-all uppercase text-[10px] tracking-tighter"
                                              title="עריכה"
                                          >
                                              עריכה ✎
                                          </button>
                                          <button 
                                              onClick={() => handleDeleteProfile(p.id)} 
                                              className="font-black text-red-300 hover:text-red-600 transition-all uppercase text-[10px] tracking-tighter"
                                              title="מחיקה"
                                          >
                                              מחקי 🗑
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

                {/* Mobile Users Cards */}
                <div className="grid md:hidden gap-4 pb-20">
                  {profiles.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-brand-stone/10 shadow-sm relative">
                          <div className="flex justify-between items-start">
                              <div className="flex-1">
                                  <p className="font-bold text-xl italic tracking-tight">{p.full_name}</p><p className="text-xs opacity-40 font-medium mt-1">{p.email}</p>
                                  {/* תצוגת טלפון וכפתור ווצאפ למובייל */}
                                  {p.phone && (
                                      <div className="flex items-center gap-2 mt-3">
                                          <span className="text-xs font-bold tabular-nums opacity-60">{p.phone}</span>
                                          <a 
                                              href={`https://wa.me/${p.phone.replace(/\D/g, '').replace(/^0/, '972')}`} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100 active:scale-95 transition-all"
                                          >
                                              <span>WhatsApp</span>
                                              <span className="text-xs">📱</span>
                                          </a>
                                      </div>
                                  )}
                              </div>
                              
                              {/* בועית ניקובים מעוצבת */}
                              <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${p.punch_card_remaining > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {p.punch_card_remaining} כרטיסיה
                              </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-brand-stone/5 flex justify-between items-center">
                              <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{p.membership_type} בשבוע</span>
                              <div className="flex gap-6">
                                  <button 
                                      onClick={() => { setEditingUserId(p.id); setUserFormData(p); }} 
                                      className="text-xs font-bold opacity-60 underline underline-offset-4"
                                  >
                                      עריכה ✎
                                  </button>
                                  <button 
                                      onClick={() => handleDeleteProfile(p.id)} 
                                      className="text-xs font-bold text-red-400 underline underline-offset-4"
                                  >
                                      מחיקה 🗑
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Class Details & Manual Booking */}
        {detailsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3.5rem] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-10">
                    <div><h3 className="text-2xl font-bold italic tracking-tight">{detailsModal.name}</h3><p className="opacity-40 text-sm font-bold uppercase tracking-widest">{new Date(detailsModal.start_time).toLocaleString('he-IL', {weekday: 'long', hour:'2-digit', minute:'2-digit'})}</p></div>
                    <button onClick={() => setDetailsModal(null)} className="text-2xl opacity-20 hover:opacity-100 transition-all">❌</button>
                </div>
                <div className="mb-10"><h4 className="text-[10px] font-black uppercase opacity-40 mb-5 tracking-widest">מתאמנות רשומות ({detailsModal.bookings?.length || 0})</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {detailsModal.bookings?.map((b: any) => (
                            <div key={b.id} className="bg-brand-bg p-4 rounded-2xl flex justify-between items-center text-sm shadow-sm transition-transform hover:scale-[1.01]">
                                <span className="font-bold">{b.profiles?.full_name}</span>
                                <button onClick={() => handleRemoveAttendee(b.id)} className="text-red-300 hover:text-red-500 font-bold text-[10px] transition-all uppercase">הסרה 🗑</button>
                            </div>
                        ))}
                        {!detailsModal.bookings?.length && <p className="text-center py-6 opacity-30 italic text-sm">אין עדיין רשומות לשיעור זה</p>}
                    </div>
                </div>
                <div className="bg-brand-stone/5 p-8 rounded-[2.5rem] border border-brand-stone/10">
                    <h4 className="text-[10px] font-black opacity-40 mb-5 uppercase tracking-widest">רישום ידני (עקיפת מכסה)</h4>
                    <div className="flex gap-2">
                        <select className="flex-1 p-4 bg-white rounded-2xl text-sm font-bold border outline-none shadow-sm" value={manualBookingUserId} onChange={e => setManualBookingUserId(e.target.value)}>
                            <option value="">בחרי מתאמנת...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                        </select>
                        <button onClick={handleManualBooking} disabled={!manualBookingUserId} className="bg-brand-dark text-white px-8 rounded-2xl font-bold text-xs disabled:opacity-20 transition-all shadow-md active:scale-95">רישום</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Modal: Smart Deletion */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
            <div className="bg-white p-12 rounded-[4rem] max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 italic text-center tracking-tight">ביטול שיעור 🧘‍♀️</h3>
              <p className="text-sm text-center mb-10 opacity-60 leading-relaxed font-medium">האם לבטל רק את השיעור הספציפי הזה, או שזהו שיעור קבוע שתרצי לבטל את כולו מהיום והלאה?</p>
              <div className="space-y-4">
                <button onClick={() => processDeletion('single')} className="w-full bg-brand-bg p-6 rounded-3xl font-bold hover:bg-brand-stone/10 transition-all text-sm tracking-tight">ביטול השיעור הזה בלבד</button>
                {deleteModal.classItem.recurring_id && <button onClick={() => processDeletion('future')} className="w-full bg-red-50 text-red-600 p-6 rounded-3xl font-bold hover:bg-red-100 transition-all text-sm tracking-tight">ביטול כל הסדרה מהיום והלאה</button>}
                <button onClick={() => setDeleteModal(null)} className="w-full p-2 text-[10px] font-black opacity-30 mt-10 uppercase underline tracking-[0.2em] transition-opacity hover:opacity-100">חזרה לניהול</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}