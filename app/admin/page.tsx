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

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // טופס שיעור
  const [classFormData, setClassFormData] = useState({
    name: '',
    class_type: 'פילאטיס מכשירים',
    start_time: '',
    max_capacity: 6,
    is_recurring: false // שדה חדש לשיעור קבוע
  });

  // ניהול עריכת משתמשת
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    membership_type: 2,
    punch_card_remaining: 0,
    punch_card_expiry: ''
  });

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
        const { data } = await supabase.from('classes').select('*, bookings!class_id(id)').order('start_time');
        setClasses(data || []);
      } else {
        const { data } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
        setProfiles(data || []);
      }
    } catch (e) { console.error(e); }
    setIsFetching(false);
  };

  useEffect(() => {
    if (isLoaded && user) loadData();
  }, [activeTab, isLoaded, user]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    const startDate = new Date(classFormData.start_time);
    const mins = startDate.getMinutes();

    // ולידציה: רק שעה עגולה או חצי
    if (mins !== 0 && mins !== 30) {
        return alert("ניתן לקבוע שיעורים רק בשעות עגולות (00) או בחצאים (30) ⏳");
    }

    const classesToInsert = [];
    // אם זה שיעור קבוע - ניצור 8 מופעים (חודשיים קדימה)
    const iterations = classFormData.is_recurring ? 8 : 1;

    for (let i = 0; i < iterations; i++) {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + (i * 7));
        classesToInsert.push({
            name: classFormData.name,
            class_type: classFormData.class_type,
            start_time: currentStart.toISOString(),
            max_capacity: classFormData.max_capacity
        });
    }
    
    const { error } = await supabase.from('classes').insert(classesToInsert);
    if (error) alert(error.message);
    else {
      alert(iterations > 1 ? "שיעורים קבועים נוספו ל-8 השבועות הקרובים!" : "השיעור נוסף בהצלחה!");
      setClassFormData({ ...classFormData, name: '', start_time: '', is_recurring: false });
      loadData();
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;

    const payload = {
        ...userFormData,
        email: userFormData.email.trim().toLowerCase(),
        updated_at: new Date().toISOString()
    };

    let error;
    if (editingUserId) {
        // עדכון קיימת
        const { error: err } = await supabase.from('profiles').update(payload).eq('id', editingUserId);
        error = err;
    } else {
        // יצירת חדשה
        const { error: err } = await supabase.from('profiles').insert([{ ...payload, is_approved: true }]);
        error = err;
    }

    if (error) alert(error.message);
    else {
      alert(editingUserId ? "הפרטים עודכנו!" : "מתאמנת נוספה!");
      setEditingUserId(null);
      setUserFormData({ full_name: '', email: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: '' });
      loadData();
    }
  };

  const startEditUser = (p: any) => {
      setEditingUserId(p.id);
      setUserFormData({
          full_name: p.full_name,
          email: p.email,
          membership_type: p.membership_type,
          punch_card_remaining: p.punch_card_remaining,
          punch_card_expiry: p.punch_card_expiry || ''
      });
  };

  const handleDeleteClass = async (id: string) => {
    if(!confirm("למחוק?")) return;
    const supabase = await getAuthenticatedSupabase();
    await supabase?.from('classes').delete().eq('id', id);
    loadData();
  };

  const handleDeleteProfile = async (id: string) => {
    if(!confirm("למחוק מתאמנת?")) return;
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
      <div className="max-w-[1500px] mx-auto">
        
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
          <h1 className="text-4xl font-extrabold italic">ניהול הסטודיו</h1>
          <div className="flex bg-white p-2 rounded-3xl border border-brand-stone/20 shadow-sm">
            <button onClick={() => setActiveTab('schedule')} className={`px-8 py-2 rounded-2xl font-bold transition-all ${activeTab === 'schedule' ? 'bg-brand-dark text-white' : 'text-brand-dark/50'}`}>מערכת שעות</button>
            <button onClick={() => setActiveTab('users')} className={`px-8 py-2 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white' : 'text-brand-dark/50'}`}>מתאמנות</button>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-brand-stone/20">
             <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }}>←</button>
             <span className="font-bold text-sm min-w-[140px] text-center">{weekDates[0].toLocaleDateString('he-IL')} - {weekDates[6].toLocaleDateString('he-IL')}</span>
             <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }}>→</button>
          </div>
        </header>

        {activeTab === 'schedule' ? (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
              <h2 className="text-xl font-bold mb-6 italic">שיעור חדש</h2>
              <form onSubmit={handleCreateClass} className="space-y-5">
                <input type="text" placeholder="שם השיעור" required className="w-full p-4 bg-brand-bg rounded-xl outline-none" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})} />
                <input type="datetime-local" step="1800" required className="w-full p-4 bg-brand-bg rounded-xl outline-none" value={classFormData.start_time} onChange={e => setClassFormData({...classFormData, start_time: e.target.value})} />
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-brand-bg rounded-xl transition-all">
                    <input type="checkbox" className="w-5 h-5 accent-brand-dark" checked={classFormData.is_recurring} onChange={e => setClassFormData({...classFormData, is_recurring: e.target.checked})} />
                    <span className="text-sm font-bold">שיעור קבוע (ל-8 שבועות)</span>
                </label>
                <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-xl font-bold shadow-lg">הוספה</button>
              </form>
            </div>

            <div className="lg:col-span-9 flex bg-white rounded-[3rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[850px]">
              <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-20 text-[10px] opacity-20 font-black">
                {TIME_SLOTS.map((s, i) => <div key={i} className={s==='break' ? 'h-16 bg-brand-stone/10' : 'h-[100px] flex justify-center'}>{s!=='break' && s}</div>)}
              </div>
              <div className="flex-1 grid grid-cols-7 relative">
                {weekDates.map((date, dayIdx) => (
                  <div key={dayIdx} className="relative border-l border-brand-stone/5 last:border-l-0">
                    <div className="h-20 flex flex-col items-center justify-center border-b border-brand-stone/10 font-bold">
                        <span className="text-[9px] opacity-30 uppercase">{DAYS_HEBREW[dayIdx]}</span>
                        <span>{date.getDate()}</span>
                    </div>
                    <div className="relative" style={{ height: 'calc(14 * 100px + 64px)' }}>
                      {classes.filter(c => new Date(c.start_time).toDateString() === date.toDateString()).map(c => {
                          const start = new Date(c.start_time);
                          const h = start.getHours();
                          const m = start.getMinutes();
                          let top = h >= 7 && h <= 13 ? (h-7 + m/60)*100 : (h-16 + m/60)*100 + 700 + 64;
                          return (
                            <div key={c.id} className="absolute inset-x-1 p-2 bg-brand-bg border rounded-2xl text-[10px] font-bold shadow-sm" style={{ top: `${top}px` }}>
                              {c.name} <button onClick={() => handleDeleteClass(c.id)} className="float-left text-red-300">✕</button>
                              <div className="opacity-40">{c.bookings?.length || 0}/{c.max_capacity}</div>
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
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
              <h2 className="text-xl font-bold mb-6 italic">{editingUserId ? 'עריכת מתאמנת' : 'מתאמנת חדשה'}</h2>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <input type="text" placeholder="שם מלא" required className="w-full p-3 bg-brand-bg rounded-xl outline-none" value={userFormData.full_name} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} />
                <input type="email" placeholder="אימייל" required className="w-full p-3 bg-brand-bg rounded-xl outline-none" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <div>
                        <label>מנוי שבועי</label>
                        <input type="number" className="w-full p-3 bg-brand-bg rounded-xl mt-1" value={userFormData.membership_type} onChange={e => setUserFormData({...userFormData, membership_type: parseInt(e.target.value)})} />
                    </div>
                    <div>
                        <label>ניקובים</label>
                        <input type="number" className="w-full p-3 bg-brand-bg rounded-xl mt-1" value={userFormData.punch_card_remaining} onChange={e => setUserFormData({...userFormData, punch_card_remaining: parseInt(e.target.value)})} />
                    </div>
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-xl font-bold">{editingUserId ? 'עדכן פרטים' : 'הוספה למערכת'}</button>
                {editingUserId && <button type="button" onClick={() => { setEditingUserId(null); setUserFormData({full_name:'', email:'', membership_type:2, punch_card_remaining:0, punch_card_expiry:''}); }} className="w-full text-xs font-bold opacity-30 mt-2">ביטול עריכה</button>}
              </form>
            </div>

            <div className="lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border border-brand-stone/20 overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-brand-stone/5 border-b border-brand-stone/10 text-[10px] font-black uppercase opacity-40">
                            <th className="p-4">שם מלא</th>
                            <th className="p-4">אימייל</th>
                            <th className="p-4 text-center">מנוי שבועי</th>
                            <th className="p-4 text-center">ניקובים</th>
                            <th className="p-4">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                        {profiles.map(p => (
                            <tr key={p.id} className="border-b border-brand-stone/5 hover:bg-brand-bg/30 transition-colors">
                                <td className="p-4 font-bold">{p.full_name}</td>
                                <td className="p-4 text-xs opacity-50">{p.email}</td>
                                <td className="p-4 text-center">{p.membership_type} אימונים</td>
                                <td className="p-4 text-center">{p.punch_card_remaining}</td>
                                <td className="p-4 flex gap-4">
                                    <button onClick={() => startEditUser(p)} className="text-brand-dark/50 hover:text-brand-dark transition-colors">✎ ערוך</button>
                                    <button onClick={() => handleDeleteProfile(p.id)} className="text-red-300 hover:text-red-500 transition-colors">🗑 מחק</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}