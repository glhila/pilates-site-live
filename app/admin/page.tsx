'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth, useUser } from "@clerk/nextjs"; // הוספנו את useAuth

// הגדרת בסיס ללא טוקן
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // פונקציה לקבלת הטוקן
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

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

  // פונקציית עזר ליצירת קליינט מאובטח
  // זה הקסם שפותר את השגיאה: אנחנו יוצרים חיבור שמכיל את הזהות שלך
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
    
    // אם אין חיבור מאובטח (למשל האדמין לא מחובר), לא ניתן לגשת לנתונים
    if (!supabase) {
        setIsFetching(false);
        return;
    }

    try {
      if (activeTab === 'schedule') {
        const { data, error } = await supabase.from('classes').select('*').order('start_time', { ascending: true });
        if (error) console.error(error);
        setClasses(data || []);
      } else {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) console.error(error);
        setProfiles(data || []);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (isLoaded && user) {
        loadData();
    }
  }, [activeTab, isLoaded, user]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase();
    if (!supabase) return alert("שגיאת התחברות: אנא רענני את הדף");
    
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
    if (!supabase) return alert("שגיאת התחברות: אנא רענני את הדף");

    // וידוא שהמייל תקין (אותיות קטנות וללא רווחים)
    const cleanEmail = userFormData.email.trim().toLowerCase();

    // הוספת מתאמנת חדשה לטבלה
    const { error } = await supabase.from('profiles').insert([{
      ...userFormData,
      email: cleanEmail,
      is_approved: true,
      clerk_id: null
    }]);

    if (error) {
        if (error.code === '23505') alert("שגיאה: המייל הזה כבר קיים במערכת");
        else alert("שגיאה בהוספת מתאמנת: " + error.message);
    } else {
      alert("המתאמנת נוספה בהצלחה! היא יכולה כעת להירשם לאתר.");
      setUserFormData({ full_name: '', email: '', membership_type: 2, punch_card_remaining: 0, punch_card_expiry: '' });
      loadData();
    }
  };

  // מחיקת מתאמנת קיימת
  const handleDeleteProfile = async (id: string) => {
      if(!confirm("למחוק מתאמנת?")) return;
      const supabase = await getAuthenticatedSupabase();
      if (!supabase) return;

      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) alert("שגיאה במחיקה: " + error.message);
      else loadData();
  };

  const handleDeleteClass = async (id: string) => {
      if(!confirm("למחוק שיעור?")) return;
      const supabase = await getAuthenticatedSupabase();
      if (!supabase) return;

      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) alert("שגיאה במחיקה: " + error.message);
      else loadData();
  };

  // בדיקת הרשאות פשוטה בצד לקוח (לא מחליף את ה-RLS)
  if (isLoaded && user?.primaryEmailAddress?.emailAddress !== 'hilaglazz13@gmail.com') {
      return <div className="p-10 text-center font-bold text-red-500">אין לך הרשאת גישה לדף זה.</div>;
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8 font-sans antialiased text-brand-dark" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* כותרת וניווט */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 border-b border-brand-stone/20 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">ניהול הסטודיו</h1>
            <p className="text-brand-dark/50 text-base mt-1 font-medium">מחוברת כ: {user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
          </div>

          <div className="bg-brand-stone/10 p-1.5 rounded-2xl flex gap-1 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-dark/60 hover:bg-brand-stone/20'}`}
            >
              מערכת שעות
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-dark/60 hover:bg-brand-stone/20'}`}
            >
              ניהול מתאמנות
            </button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'schedule' ? (
            /* טאב מערכת שעות */
            <div className="grid md:grid-cols-3 gap-10">
              <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
                <h2 className="text-xl font-bold mb-6 italic">הוספת שיעור</h2>
                <form onSubmit={handleCreateClass} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark/40 mr-1 uppercase tracking-widest">שם השיעור</label>
                    <input 
                      type="text" placeholder="למשל: Reformer Flow" required
                      className="w-full p-4 bg-brand-bg/50 rounded-2xl border border-brand-stone/30 outline-none font-medium"
                      value={classFormData.name}
                      onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark/40 mr-1 uppercase tracking-widest">סוג פעילות</label>
                    <select 
                      className="w-full p-4 bg-brand-bg/50 rounded-2xl border border-brand-stone/30 outline-none font-medium"
                      value={classFormData.class_type}
                      onChange={e => setClassFormData({...classFormData, class_type: e.target.value})}
                    >
                      <option>פילאטיס מכשירים</option>
                      <option>פילאטיס מזרן</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark/40 mr-1 uppercase tracking-widest">תאריך ושעה</label>
                    <input 
                      type="datetime-local" required style={{ colorScheme: 'light' }}
                      className="w-full p-4 bg-brand-bg/50 rounded-2xl border border-brand-stone/30 outline-none font-medium"
                      value={classFormData.start_time}
                      onChange={e => setClassFormData({...classFormData, start_time: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl">
                    הוספה למערכת
                  </button>
                </form>
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold italic">שיעורים קרובים</h2>
                    <button onClick={loadData} className="text-xs font-bold text-brand-dark/40 hover:text-brand-dark transition-colors">רענן ↻</button>
                </div>
                <div className="grid gap-4">
                    {classes.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-brand-stone/10 flex justify-between items-center shadow-sm group">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center text-xl shadow-inner">🗓️</div>
                          <div>
                            <p className="font-bold text-lg leading-tight">{c.name}</p>
                            <p className="text-sm text-brand-dark/50 mt-1 font-medium">{new Date(c.start_time).toLocaleString('he-IL', {weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteClass(c.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">מחיקה</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            
            /* טאב ניהול מתאמנות */
            <div className="grid md:grid-cols-3 gap-10">
              
              {/* טופס הוספת מתאמנת */}
              <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
                <h2 className="text-xl font-bold mb-6 italic">הוספת מתאמנת חדשה</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-dark/40 mr-1 uppercase">שם מלא</label>
                    <input 
                      type="text" required
                      className="w-full p-3 bg-brand-bg/50 rounded-xl border border-brand-stone/20 outline-none font-medium text-sm"
                      value={userFormData.full_name}
                      onChange={e => setUserFormData({...userFormData, full_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-dark/40 mr-1 uppercase">אימייל (לצורך התחברות)</label>
                    <input 
                      type="email" required
                      className="w-full p-3 bg-brand-bg/50 rounded-xl border border-brand-stone/20 outline-none font-medium text-sm"
                      value={userFormData.email}
                      onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-brand-dark/40 mr-1 uppercase">אימונים בשבוע</label>
                        <input 
                        type="number" min="0" max="7"
                        className="w-full p-3 bg-brand-bg/50 rounded-xl border border-brand-stone/20 outline-none font-medium text-sm"
                        value={userFormData.membership_type}
                        onChange={e => setUserFormData({...userFormData, membership_type: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-brand-dark/40 mr-1 uppercase">ניקובים בכרטיסייה</label>
                        <input 
                        type="number" min="0"
                        className="w-full p-3 bg-brand-bg/50 rounded-xl border border-brand-stone/20 outline-none font-medium text-sm"
                        value={userFormData.punch_card_remaining}
                        onChange={e => setUserFormData({...userFormData, punch_card_remaining: parseInt(e.target.value)})}
                        />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-dark/40 mr-1 uppercase">תוקף כרטיסייה (אופציונלי)</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-brand-bg/50 rounded-xl border border-brand-stone/20 outline-none font-medium text-sm"
                      value={userFormData.punch_card_expiry}
                      onChange={e => setUserFormData({...userFormData, punch_card_expiry: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-2xl font-bold hover:bg-brand-dark/90 transition-all shadow-lg mt-2">
                    אישור והוספה למערכת
                  </button>
                </form>
              </div>

              {/* רשימת המתאמנות */}
              <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold italic">מתאמנות רשומות</h2>
                  <div className="flex gap-4 items-center">
                      <button onClick={loadData} className="text-xs font-bold text-brand-dark/40 hover:text-brand-dark transition-colors">רענן רשימה ↻</button>
                      <span className="bg-brand-stone/10 px-3 py-1 rounded-full text-[10px] font-bold">{profiles.length} סה"כ</span>
                  </div>
              </div>

                <div className="grid gap-3">
                    {profiles.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-3xl border border-brand-stone/10 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 text-right">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${p.clerk_id ? 'bg-green-50 text-green-600' : 'bg-brand-stone/10 text-brand-stone/40'}`}>
                            {p.clerk_id ? '✓' : '👤'}
                          </div>
                          <div>
                            <p className="font-bold">{p.full_name || 'מתאמנת חדשה'}</p>
                            <p className="text-xs text-brand-dark/40 font-medium">{p.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase text-brand-dark/30">מנוי / כרטיסייה</p>
                                <p className="text-xs font-bold">{p.membership_type} בשבוע | {p.punch_card_remaining} ניקובים</p>
                            </div>
                            <button 
                                onClick={() => handleDeleteProfile(p.id)}
                                className="text-red-300 hover:text-red-500 transition-colors mr-4"
                            >
                                🗑️
                            </button>
                        </div>
                      </div>
                    ))}
                    {profiles.length === 0 && <p className="text-center p-10 text-brand-dark/30 italic">אין מתאמנות במערכת</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}