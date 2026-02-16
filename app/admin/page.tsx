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

  const [classFormData, setClassFormData] = useState({
    name: '',
    class_type: 'פילאטיס מכשירים',
    start_time: '',
    max_capacity: 6
  });

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
    } catch (e) {
      return null;
    }
  };

  const loadData = async () => {
    setIsFetching(true);
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) { setIsFetching(false); return; }

    try {
      if (activeTab === 'schedule') {
        const { data, error } = await supabase
          .from('classes')
          .select('*, bookings!class_id(id)')
          .order('start_time');
        if (error) throw error;
        setClasses(data || []);
      } else {
        // תיקון שגיאה 400: מיון לפי updated_at במקום created_at
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setProfiles(data || []);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (isLoaded && user) loadData();
  }, [activeTab, isLoaded, user]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('classes').insert([classFormData]);
    if (error) alert(error.message);
    else {
      alert("השיעור נוסף!");
      setClassFormData({ ...classFormData, name: '', start_time: '' });
      loadData();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('profiles').insert([{
      ...userFormData,
      email: userFormData.email.trim().toLowerCase(),
      is_approved: true,
      updated_at: new Date().toISOString()
    }]);
    if (error) alert(error.message);
    else {
      alert("מתאמנת נוספה!");
      setUserFormData({ full_name: '', email: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: '' });
      loadData();
    }
  };

  const handleDeleteClass = async (id: string) => {
    if(!confirm("למחוק שיעור?")) return;
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
      <div className="max-w-[1400px] mx-auto">
        
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold italic tracking-tight">ניהול הסטודיו</h1>
            <div className="flex gap-4 mt-6">
                <button onClick={() => setActiveTab('schedule')} className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-lg' : 'bg-white border border-brand-stone/20'}`}>מערכת שעות</button>
                <button onClick={() => setActiveTab('users')} className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-lg' : 'bg-white border border-brand-stone/20'}`}>ניהול מתאמנות</button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-brand-stone/20 shadow-sm">
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center font-bold">→</button>
            <span className="font-bold text-sm min-w-[150px] text-center">{weekDates[0].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})} - {weekDates[6].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})}</span>
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center font-bold">←</button>
          </div>
        </header>

        {activeTab === 'schedule' ? (
          <div className="grid lg:grid-cols-12 gap-10">
            {/* טופס הוספה - תופס 3 עמודות מתוך 12 כדי להיות רחב יותר */}
            <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit sticky top-10">
              <h2 className="text-2xl font-bold mb-8 italic">שיעור חדש</h2>
              <form onSubmit={handleCreateClass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase block mr-1">שם השיעור</label>
                  <input type="text" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-medium border border-brand-stone/10" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase block mr-1">זמן (תאריך ושעה)</label>
                  <input type="datetime-local" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-medium border border-brand-stone/10" value={classFormData.start_time} onChange={e => setClassFormData({...classFormData, start_time: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-xl mt-4">הוספה</button>
              </form>
            </div>

            {/* Time Grid - תופס 9 עמודות */}
            <div className="lg:col-span-9 flex bg-white rounded-[3rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[900px]">
              <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-20">
                {TIME_SLOTS.map((slot, i) => (
                  <div key={i} className={`flex items-start justify-center text-[10px] font-black opacity-20 ${slot === 'break' ? 'h-16 bg-brand-stone/10' : 'h-[100px]'}`}>{slot !== 'break' && slot}</div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 relative">
                {weekDates.map((date, dayIdx) => (
                  <div key={dayIdx} className="relative border-l border-brand-stone/5 last:border-l-0">
                    <div className="h-20 flex flex-col items-center justify-center border-b border-brand-stone/10">
                        <span className="text-[10px] font-black opacity-30 uppercase">{DAYS_HEBREW[dayIdx]}</span>
                        <span className="font-bold text-lg">{date.getDate()}</span>
                    </div>
                    <div className="relative" style={{ height: 'calc(14 * 100px + 64px)' }}>
                      {classes.filter(c => new Date(c.start_time).toDateString() === date.toDateString()).map(c => {
                          const startTime = new Date(c.start_time);
                          const hour = startTime.getHours();
                          const mins = startTime.getMinutes();
                          let topPos = hour >= MORNING_START && hour <= MORNING_END ? (hour - MORNING_START + mins/60) * HOUR_HEIGHT : (hour - EVENING_START + mins/60) * HOUR_HEIGHT + (7 * HOUR_HEIGHT) + 64;
                          return (
                            <div key={c.id} className="absolute inset-x-1.5 p-3 bg-brand-bg border border-brand-stone/20 rounded-2xl shadow-sm z-10">
                              <p className="text-[11px] font-bold leading-tight">{c.name}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] font-black opacity-40">{c.bookings?.length || 0}/{c.max_capacity}</span>
                                <button onClick={() => handleDeleteClass(c.id)} className="text-red-300 hover:text-red-500 text-[11px]">🗑️</button>
                              </div>
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
          /* ניהול מתאמנות */
          <div className="grid lg:grid-cols-12 gap-10">
            {/* טופס הוספת מתאמנת */}
            <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
              <h2 className="text-2xl font-bold mb-8 italic">מתאמנת חדשה</h2>
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase block mr-1">שם מלא</label>
                  <input type="text" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={userFormData.full_name} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black opacity-40 uppercase block mr-1">אימייל</label>
                  <input type="email" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black opacity-40 uppercase block mr-1">מנוי שבועי</label>
                    <input type="number" className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.membership_type} onChange={e => setUserFormData({...userFormData, membership_type: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black opacity-40 uppercase block mr-1">ניקובים</label>
                    <input type="number" className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.punch_card_remaining} onChange={e => setUserFormData({...userFormData, punch_card_remaining: parseInt(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-xl">הוספה</button>
              </form>
            </div>

            {/* רשימה */}
            <div className="lg:col-span-8 grid md:grid-cols-2 gap-5 h-fit">
                {profiles.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-brand-stone/10 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg">{p.full_name}</p>
                        <p className="text-xs opacity-40">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-left text-xs font-bold">
                            {p.membership_type} בשבוע | {p.punch_card_remaining} ניקובים
                        </div>
                        <button onClick={() => handleDeleteProfile(p.id)} className="text-red-200 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}