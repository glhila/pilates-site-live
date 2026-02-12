'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// אתחול Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    class_type: 'פילאטיס מכשירים',
    start_time: '',
    max_capacity: 6
  });

  const loadData = async () => {
    if (!supabase) return;
    setIsFetching(true);
    try {
      if (activeTab === 'schedule') {
        const { data } = await supabase.from('classes').select('*').order('start_time', { ascending: true });
        setClasses(data || []);
      } else {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setProfiles(data || []);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return alert("חיבור ל-Supabase לא הוגדר");
    
    const { error } = await supabase.from('classes').insert([formData]);
    if (error) alert("שגיאה: " + error.message);
    else {
      alert("השיעור נוסף בהצלחה!");
      setFormData({ ...formData, name: '', start_time: '' });
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* כותרת וניווט - שימוש ב-brand-dark */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 border-b border-brand-stone/20 pb-8">
          <div>
            <h1 className="text-4xl font-black text-brand-dark tracking-tight">ניהול הסטודיו</h1>
            <p className="text-brand-dark/50 text-sm mt-1 font-medium">עונג של פילאטיס • לוח בקרה</p>
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
            <div className="grid md:grid-cols-3 gap-10">
              
              {/* טופס הוספה מעוצב */}
              <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit">
                <h2 className="text-xl font-bold mb-6 text-brand-dark">הוספת שיעור</h2>
                <form onSubmit={handleCreateClass} className="space-y-5">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark/40 mr-1 uppercase tracking-wider">שם השיעור</label>
                    <input 
                      type="text" placeholder="למשל: Reformer Flow" required
                      className="w-full p-4 bg-brand-bg/50 rounded-2xl border border-brand-stone/30 text-brand-dark focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder:opacity-30"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark/40 mr-1 uppercase tracking-wider">סוג פעילות</label>
                    <select 
                      className="w-full p-4 bg-brand-bg/50 rounded-2xl border border-brand-stone/30 text-brand-dark focus:ring-2 focus:ring-brand-primary/20 outline-none appearance-none cursor-pointer"
                      value={formData.class_type}
                      onChange={e => setFormData({...formData, class_type: e.target.value})}
                    >
                      <option>פילאטיס מכשירים</option>
                      <option>פילאטיס מזרן</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark/40 mr-1 uppercase tracking-wider">תאריך ושעה</label>
                    <input 
                      type="datetime-local" 
                      required
                      style={{ colorScheme: 'light' }}
                      className="w-full p-4 bg-brand-bg/50 rounded-2xl border border-brand-stone/30 text-brand-dark focus:ring-2 focus:ring-brand-primary/20 outline-none min-h-[56px] block"
                      value={formData.start_time}
                      onChange={e => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-brand-dark/10 mt-4 active:scale-[0.98]">
                    הוספה למערכת
                  </button>
                </form>
              </div>

              {/* רשימת השיעורים */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-dark italic">שיעורים קרובים</h2>
                    <button onClick={loadData} className="text-xs font-bold text-brand-primary hover:opacity-70 transition-opacity">רענן נתונים</button>
                </div>
                
                {isFetching ? (
                   <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-24 bg-brand-stone/5 animate-pulse rounded-[2rem]"></div>)}
                   </div>
                ) : (
                  <div className="grid gap-4">
                    {classes.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-brand-stone/10 flex justify-between items-center shadow-sm hover:border-brand-stone/30 transition-all group">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center text-xl shadow-inner">🗓️</div>
                          <div>
                            <p className="font-bold text-brand-dark text-lg leading-tight">{c.name}</p>
                            <p className="text-sm text-brand-dark/50 mt-1 font-medium">
                              {new Date(c.start_time).toLocaleString('he-IL', {weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'})}
                            </p>
                            <span className="inline-block mt-2 px-3 py-0.5 bg-brand-stone/10 text-[10px] font-bold rounded-full text-brand-dark/60 uppercase tracking-widest">{c.class_type}</span>
                          </div>
                        </div>
                        <button 
                          onClick={async () => { if(confirm("למחוק את השיעור?")) { await supabase?.from('classes').delete().eq('id', c.id); loadData(); } }} 
                          className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          מחיקה
                        </button>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <div className="p-20 border-2 border-dashed border-brand-stone/20 rounded-[3rem] text-center">
                        <p className="text-brand-dark/30 font-medium">אין שיעורים מתוזמנים במערכת</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* טאב ניהול מתאמנות */
            <div className="bg-white rounded-[3rem] border border-brand-stone/20 p-12 shadow-sm text-center">
               <div className="max-w-md mx-auto">
                 <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">👥</div>
                 <h2 className="text-2xl font-bold mb-2 text-brand-dark">מתאמנות הסטודיו</h2>
                 {isFetching ? <p className="text-brand-dark/40 animate-pulse font-medium">טוען רשימה...</p> : (
                   <div>
                     <p className="text-brand-dark/60 mb-8 font-medium">רשימת כל הנרשמות לאתר שלך</p>
                     {profiles.length === 0 ? (
                        <p className="text-brand-dark/30 italic">טרם נרשמו מתאמנות</p>
                     ) : (
                       <div className="grid gap-3">
                         {profiles.map(p => (
                           <div key={p.id} className="p-4 bg-brand-bg/30 rounded-2xl border border-brand-stone/10 flex items-center justify-between">
                             <div className="text-right">
                               <p className="font-bold text-brand-dark">{p.full_name || 'ללא שם'}</p>
                               <p className="text-xs text-brand-dark/40 font-medium">{p.email || ''}</p>
                             </div>
                             <div className="text-[10px] font-bold text-brand-stone uppercase">פרופיל פעיל</div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}