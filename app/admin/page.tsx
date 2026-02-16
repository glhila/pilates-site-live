'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth, useUser } from "@clerk/nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // ניהול מודאלים
  const [deleteModal, setDeleteModal] = useState<{show: boolean, classItem: any} | null>(null);
  const [detailsModal, setDetailsModal] = useState<any | null>(null);

  // טופס שיעור
  const [classFormData, setClassFormData] = useState({
    name: CLASS_TEMPLATES[0],
    class_type: 'פילאטיס מכשירים',
    date: '', 
    hour: '08', 
    minute: '00',
    max_capacity: 6,
    is_recurring: false
  });

  // טופס מתאמנת
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    full_name: '', email: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: ''
  });

  // טופס רישום ידני בתוך מודאל
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
      if (activeTab === 'schedule') {
        const { data: cls } = await supabase
          .from('classes')
          .select('*, bookings!class_id(id, profiles(id, full_name, email))')
          .order('start_time');
        setClasses(cls || []);
      }
      
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      setProfiles(profs || []);
      
    } catch (e) { console.error(e); }
    setIsFetching(false);
  };

  useEffect(() => {
    if (isLoaded && user) loadData();
  }, [activeTab, isLoaded, user]);

  // לוגיקת הוספת שיעור
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
    else {
      alert(iterations > 1 ? "שיעורים קבועים נוספו לכל השנה!" : "השיעור נוסף!");
      setClassFormData({ ...classFormData, date: '', is_recurring: false });
      loadData();
    }
  };

  // רישום ידני של אדמין
  const handleManualBooking = async () => {
    if (!manualBookingUserId || !detailsModal) return;
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    const { error } = await supabase.from('bookings').insert({
        user_id: manualBookingUserId,
        class_id: detailsModal.id,
        payment_source: 'admin_manual'
    });

    if (error) {
        if (error.code === '23505') alert("המתאמנת כבר רשומה");
        else alert("שגיאה: " + error.message);
    } else {
        alert("נרשמה בהצלחה!");
        setManualBookingUserId("");
        setDetailsModal(null);
        loadData();
    }
  };

  // מחיקת שיעור חכמה
  const processDeletion = async (type: 'single' | 'future') => {
    if (!deleteModal) return;
    const { classItem } = deleteModal;
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    let query = supabase.from('classes').delete();
    if (type === 'single' || !classItem.recurring_id) {
        query = query.eq('id', classItem.id);
    } else {
        query = query.eq('recurring_id', classItem.recurring_id).gte('start_time', classItem.start_time);
    }

    const { error } = await query;
    if (error) alert(error.message);
    setDeleteModal(null);
    loadData();
  };

  // ניהול מתאמנות (שמירה/עריכה)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    const payload = {
        full_name: userFormData.full_name,
        email: userFormData.email.trim().toLowerCase(),
        membership_type: userFormData.membership_type,
        punch_card_remaining: userFormData.punch_card_remaining,
        updated_at: new Date().toISOString()
    };

    const { error } = editingUserId 
        ? await supabase.from('profiles').update(payload).eq('id', editingUserId)
        : await supabase.from('profiles').insert([{ ...payload, is_approved: true }]);
    
    if (error) alert(error.message);
    else {
      setEditingUserId(null);
      setUserFormData({ full_name: '', email: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: '' });
      loadData();
    }
  };

  const startEditUser = (p: any) => {
      setEditingUserId(p.id);
      setUserFormData({
          full_name: p.full_name, email: p.email, membership_type: p.membership_type,
          punch_card_remaining: p.punch_card_remaining, punch_card_expiry: p.punch_card_expiry || ''
      });
  };

  const handleDeleteProfile = async (id: string) => {
      if(!confirm("למחוק מתאמנת לצמיתות?")) return;
      const supabase = await getAuthenticatedSupabase();
      await supabase?.from('profiles').delete().eq('id', id);
      loadData();
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

  if (isLoaded && user?.primaryEmailAddress?.emailAddress !== 'hilaglazz13@gmail.com') {
      return <div className="p-10 text-center font-bold text-red-500">אין הרשאת גישה.</div>;
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-10 font-sans text-brand-dark" dir="rtl">
      <div className="max-w-[1600px] mx-auto">
        
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
          <h1 className="text-4xl font-extrabold italic tracking-tight">ניהול סטודיו ✨</h1>
          <div className="flex bg-white p-2 rounded-3xl border border-brand-stone/20 shadow-sm">
            <button onClick={() => setActiveTab('schedule')} className={`px-10 py-2.5 rounded-2xl font-bold transition-all ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-dark/50'}`}>מערכת שעות</button>
            <button onClick={() => setActiveTab('users')} className={`px-10 py-2.5 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-dark/50'}`}>ניהול מתאמנות</button>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-brand-stone/20">
             <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }}>←</button>
             <span className="font-bold text-sm min-w-[150px] text-center tabular-nums">{weekDates[0].toLocaleDateString('he-IL')} - {weekDates[6].toLocaleDateString('he-IL')}</span>
             <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }}>→</button>
          </div>
        </header>

        {activeTab === 'schedule' ? (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* טופס הוספה */}
            <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit sticky top-10">
              <h2 className="text-xl font-bold mb-6 italic">שיעור חדש</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})}>
                    {CLASS_TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="date" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={classFormData.date} onChange={e => setClassFormData({...classFormData, date: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold" value={classFormData.hour} onChange={e => setClassFormData({...classFormData, hour: e.target.value})}>
                        {Array.from({length: 16}, (_, i) => (i + 7).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold" value={classFormData.minute} onChange={e => setClassFormData({...classFormData, minute: e.target.value})}>
                        <option value="00">00</option><option value="30">30</option>
                    </select>
                </div>
                <input type="number" min="1" className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={classFormData.max_capacity} onChange={e => setClassFormData({...classFormData, max_capacity: parseInt(e.target.value)})} />
                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-brand-bg rounded-2xl border border-dashed border-brand-stone/20">
                    <input type="checkbox" className="w-5 h-5 accent-brand-dark" checked={classFormData.is_recurring} onChange={e => setClassFormData({...classFormData, is_recurring: e.target.checked})} />
                    <span className="text-sm font-bold">שיעור קבוע לשנה 🗓️</span>
                </label>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-xl">הוספה</button>
              </form>
            </div>

            {/* Time Grid */}
            <div className="lg:col-span-9 flex bg-white rounded-[3rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[900px]">
              <div className="w-20 bg-brand-stone/5 border-l flex flex-col pt-20 text-[10px] opacity-20 font-black">
                {TIME_SLOTS.map((s, i) => <div key={i} className={s==='break' ? 'h-16 bg-brand-stone/10' : 'h-[100px] flex justify-center'}>{s!=='break' && s}</div>)}
              </div>
              <div className="flex-1 grid grid-cols-7 relative">
                {weekDates.map((date, dayIdx) => (
                  <div key={dayIdx} className="relative border-l last:border-l-0">
                    <div className="h-20 flex flex-col items-center justify-center border-b font-bold">
                        <span className="text-[9px] opacity-30 uppercase">{DAYS_HEBREW[dayIdx]}</span>
                        <span className="text-xl">{date.getDate()}</span>
                    </div>
                    <div className="relative" style={{ height: 'calc(14 * 100px + 64px)' }}>
                      {classes.filter(c => new Date(c.start_time).toDateString() === date.toDateString()).map(c => {
                          const start = new Date(c.start_time);
                          const h = start.getHours();
                          const m = start.getMinutes();
                          let top = h >= 7 && h <= 13 ? (h-7 + m/60)*100 : (h-16 + m/60)*100 + 700 + 64;
                          return (
                            <div key={c.id} onClick={() => setDetailsModal(c)} className="absolute inset-x-1 p-3 bg-brand-bg border rounded-2xl text-[11px] font-bold shadow-sm cursor-pointer z-10" style={{ top: `${top}px` }}>
                              {c.name} {c.recurring_id && "🔄"}
                              <button onClick={(e) => { e.stopPropagation(); setDeleteModal({show: true, classItem: c}); }} className="float-left text-red-300">✕</button>
                              <div className="mt-1 opacity-40">{c.bookings?.length || 0}/{c.max_capacity}</div>
                            </div>
                          );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ניהול מתאמנות - טבלה מלאה */
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border h-fit">
              <h2 className="text-xl font-bold mb-6 italic">{editingUserId ? 'עריכת מתאמנת' : 'מתאמנת חדשה'}</h2>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <input type="text" placeholder="שם מלא" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.full_name} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} />
                <input type="email" placeholder="אימייל" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                    <div className="space-y-1"><label>מנוי שבועי</label><input type="number" className="w-full p-4 bg-brand-bg rounded-2xl" value={userFormData.membership_type} onChange={e => setUserFormData({...userFormData, membership_type: parseInt(e.target.value)})} /></div>
                    <div className="space-y-1"><label>ניקובים</label><input type="number" className="w-full p-4 bg-brand-bg rounded-2xl" value={userFormData.punch_card_remaining} onChange={e => setUserFormData({...userFormData, punch_card_remaining: parseInt(e.target.value)})} /></div>
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold">{editingUserId ? 'עדכן' : 'הוספה'}</button>
                {editingUserId && <button type="button" onClick={() => setEditingUserId(null)} className="w-full text-xs font-bold opacity-30 mt-4 underline">ביטול</button>}
              </form>
            </div>

            <div className="lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead><tr className="bg-brand-stone/5 border-b text-[10px] font-black opacity-40 uppercase"><th className="p-5">שם</th><th className="p-5">אימייל</th><th className="p-5 text-center">מנוי</th><th className="p-5 text-center">ניקובים</th><th className="p-5">פעולות</th></tr></thead>
                    <tbody className="text-sm font-medium">
                        {profiles.map(p => (
                            <tr key={p.id} className="border-b hover:bg-brand-bg/40 transition-colors">
                                <td className="p-5 font-bold">{p.full_name}</td><td className="p-5 text-xs opacity-50">{p.email}</td><td className="p-5 text-center">{p.membership_type} בשבוע</td>
                                <td className="p-5 text-center">{p.punch_card_remaining}</td><td className="p-5 flex gap-4">
                                    <button onClick={() => startEditUser(p)} className="font-bold opacity-40 hover:opacity-100">✎ עריכה</button>
                                    <button onClick={() => handleDeleteProfile(p.id)} className="text-red-300 font-bold">🗑 מחקי</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* Modal פרטים ורישום ידני */}
        {detailsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
            <div className="bg-white p-8 rounded-[3rem] max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div><h3 className="text-2xl font-bold italic">{detailsModal.name}</h3><p className="opacity-40 text-sm">{new Date(detailsModal.start_time).toLocaleString('he-IL', {weekday: 'long', hour:'2-digit', minute:'2-digit'})}</p></div>
                    <button onClick={() => setDetailsModal(null)} className="text-xl opacity-20">✕</button>
                </div>
                <div className="mb-6"><h4 className="text-[10px] font-black uppercase opacity-40 mb-3">רשומות ({detailsModal.bookings?.length || 0})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">{detailsModal.bookings?.map((b: any) => <div key={b.id} className="bg-brand-bg p-3 rounded-xl flex justify-between text-sm"><span className="font-bold">{b.profiles?.full_name}</span><span className="opacity-40 text-xs">{b.profiles?.email}</span></div>)}</div>
                </div>
                <div className="bg-brand-stone/5 p-6 rounded-3xl border border-brand-stone/10"><h4 className="text-[10px] font-black opacity-40 mb-3 uppercase">רישום ידני אדמין</h4>
                    <div className="flex gap-2">
                        <select className="flex-1 p-3 bg-white rounded-xl text-sm font-bold border" value={manualBookingUserId} onChange={e => setManualBookingUserId(e.target.value)}>
                            <option value="">בחרי מתאמנת...</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                        </select>
                        <button onClick={handleManualBooking} disabled={!manualBookingUserId} className="bg-brand-dark text-white px-6 rounded-xl font-bold text-xs disabled:opacity-20">רישום</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Modal מחיקה חכמה */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3rem] max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 italic text-center">ביטול שיעור</h3>
              <p className="text-sm text-center mb-8 opacity-60">האם לבטל רק את השיעור הזה או את כל הסדרה העתידית?</p>
              <div className="space-y-3">
                <button onClick={() => processDeletion('single')} className="w-full bg-brand-bg p-5 rounded-2xl font-bold hover:bg-brand-stone/10">השיעור הזה בלבד</button>
                {deleteModal.classItem.recurring_id && <button onClick={() => processDeletion('future')} className="w-full bg-red-50 text-red-600 p-5 rounded-2xl font-bold">כל הסדרה מהיום והלאה</button>}
                <button onClick={() => setDeleteModal(null)} className="w-full p-2 text-xs font-bold opacity-30 mt-6 underline">חזרה</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}