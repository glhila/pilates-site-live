'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth, useUser } from "@clerk/nextjs";

// הגדרות בסיס
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// הגדרות לוח שעות
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
    max_capacity: 6
  });

  // טופס מתאמנת
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
      console.error("Auth error:", e);
      return null;
    }
  };

  const loadData = async () => {
    setIsFetching(true);
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) { setIsFetching(false); return; }

    try {
      if (activeTab === 'schedule') {
        // שליפת שיעורים עם ספירת הרשמות (פותר שגיאה 406 ע"י ציון הקשר המפורש)
        const { data, error } = await supabase
          .from('classes')
          .select('*, bookings!class_id(id)')
          .order('start_time');
        if (error) throw error;
        setClasses(data || []);
      } else {
        // שליפת כל הפרופילים (פותר שגיאה 400 אם ה-RLS תוקן ב-SQL)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
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

    // מניעת כפל שיעורים באותו זמן
    const newTime = new Date(classFormData.start_time).getTime();
    if (classes.some(c => new Date(c.start_time).getTime() === newTime)) {
        return alert("כבר קיים שיעור בשעה זו! אנא בחרי שעה אחרת.");
    }
    
    const { error } = await supabase.from('classes').insert([classFormData]);
    if (error) alert("שגיאה: " + error.message);
    else {
      alert("השיעור נוסף בהצלחה!");
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
      is_approved: true
    }]);

    if (error) alert("שגיאה: " + error.message);
    else {
      alert("המתאמנת נוספה בהצלחה!");
      setUserFormData({ full_name: '', email: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: '' });
      loadData();
    }
  };

  const handleDeleteClass = async (id: string) => {
    if(!confirm("למחוק את השיעור?")) return;
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
      return <div className="p-10 text-center font-bold text-red-500">אין לך הרשאת גישה לדף זה.</div>;
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-10 font-sans text-brand-dark" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Tabs */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold italic tracking-tight">ניהול הסטודיו</h1>
            <div className="flex gap-4 mt-6">
                <button 
                  onClick={() => setActiveTab('schedule')} 
                  className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-lg' : 'bg-white border border-brand-stone/20'}`}
                >
                  מערכת שעות
                </button>
                <button 
                  onClick={() => setActiveTab('users')} 
                  className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-lg' : 'bg-white border border-brand-stone/20'}`}
                >
                  ניהול מתאמנות
                </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-brand-stone/20 shadow-sm">
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} className="p-2 font-bold hover:bg-brand-bg rounded-xl w-10 h-10 flex items-center justify-center">←</button>
            <span className="font-bold text-sm min-w-[150px] text-center tabular-nums">
              {weekDates[0].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})} - {weekDates[6].toLocaleDateString('he-IL', {day:'numeric', month:'numeric'})}
            </span>
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} className="p-2 font-bold hover:bg-brand-bg rounded-xl w-10 h-10 flex items-center justify-center">→</button>
          </div>
        </header>

        {activeTab === 'schedule' ? (
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Form Column */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit sticky top-10">
              <h2 className="text-xl font-bold mb-6 italic">שיעור חדש</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-30 uppercase mr-1">שם השיעור</label>
                  <input type="text" placeholder="למשל: Flow" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-medium border border-brand-stone/10" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-30 uppercase mr-1">זמן</label>
                  <input type="datetime-local" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-medium border border-brand-stone/10" value={classFormData.start_time} onChange={e => setClassFormData({...classFormData, start_time: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-2xl font-bold shadow-xl hover:opacity-90 transition-all mt-4">
                  הוספה למערכת
                </button>
              </form>
            </div>

            {/* Time Grid Column */}
            <div className="lg:col-span-3 flex bg-white rounded-[3rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[950px]">
              <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-20">
                {TIME_SLOTS.map((slot, i) => (
                  <div key={i} className={`flex items-start justify-center text-[9px] font-black opacity-20 ${slot === 'break' ? 'h-16 bg-brand-stone/10' : 'h-[100px]'}`}>
                    {slot !== 'break' && slot}
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 relative">
                {weekDates.map((date, dayIdx) => (
                  <div key={dayIdx} className="relative border-l border-brand-stone/5 last:border-l-0">
                    <div className="h-20 flex flex-col items-center justify-center border-b border-brand-stone/10 bg-white sticky top-0 z-20">
                        <span className="text-[9px] font-black opacity-30 uppercase">{DAYS_HEBREW[dayIdx]}</span>
                        <span className="font-bold text-lg">{date.getDate()}</span>
                    </div>
                    <div className="relative" style={{ height: 'calc(14 * 100px + 64px)' }}>
                      {classes
                        .filter(c => new Date(c.start_time).toDateString() === date.toDateString())
                        .map(c => {
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
                            <div key={c.id} className="absolute inset-x-1 p-3 bg-brand-bg border border-brand-stone/20 rounded-2xl shadow-sm z-10 hover:shadow-md transition-shadow">
                              <p className="text-[11px] font-bold leading-tight">{c.name}</p>
                              <div className="flex justify-between items-end mt-2">
                                <span className="text-[9px] font-black opacity-40">{c.bookings?.length || 0}/{c.max_capacity}</span>
                                <button onClick={() => handleDeleteClass(c.id)} className="text-red-300 hover:text-red-500 text-[10px]">🗑️</button>
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
          /* Users Management Tab */
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Create User Form */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
              <h2 className="text-xl font-bold mb-6 italic">מתאמנת חדשה</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input type="text" placeholder="שם מלא" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={userFormData.full_name} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} />
                <input type="email" placeholder="אימייל" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="מנוי שבועי" className="w-full p-4 bg-brand-bg rounded-2xl border border-brand-stone/10 outline-none" value={userFormData.membership_type} onChange={e => setUserFormData({...userFormData, membership_type: parseInt(e.target.value)})} />
                  <input type="number" placeholder="ניקובים" className="w-full p-4 bg-brand-bg rounded-2xl border border-brand-stone/10 outline-none" value={userFormData.punch_card_remaining} onChange={e => setUserFormData({...userFormData, punch_card_remaining: parseInt(e.target.value)})} />
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-2xl font-bold shadow-xl mt-2">הוספה למערכת</button>
              </form>
            </div>

            {/* Users List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center px-4 mb-2">
                 <h2 className="text-xl font-bold italic">רשימת מתאמנות ({profiles.length})</h2>
                 <button onClick={loadData} className="text-xs font-bold opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest">רענן ↻</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {profiles.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-brand-stone/10 flex justify-between items-center hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${p.clerk_id ? 'bg-green-50 text-green-600' : 'bg-brand-stone/5 text-brand-dark/20'}`}>
                          {p.clerk_id ? '✓' : '👤'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{p.full_name}</p>
                          <p className="text-xs opacity-40 font-medium tracking-tight">{p.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-left hidden sm:block">
                            <p className="text-[9px] font-black opacity-30 uppercase">מנוי / כרטיסייה</p>
                            <p className="font-bold text-sm">{p.membership_type} בשבוע | {p.punch_card_remaining} ניקובים</p>
                        </div>
                        <button onClick={() => handleDeleteProfile(p.id)} className="text-red-200 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}