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
    <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-8 font-sans text-right" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* כותרת וניווט */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 border-b border-gray-200 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800">ניהול הסטודיו ⚙️</h1>
          <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-gray-200'}`}
            >
              מערכת שעות
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-gray-200'}`}
            >
              ניהול מתאמנות
            </button>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'schedule' ? (
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* טופס הוספה */}
              <div className="md:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 h-fit">
                <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">הוספת שיעור חדש</h2>
                <form onSubmit={handleCreateClass} className="space-y-5">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-1">שם השיעור:</label>
                    <input 
                      type="text" placeholder="למשל: Reformer Level 1" required
                      className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-1">סוג שיעור:</label>
                    <select 
                      className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none appearance-none"
                      value={formData.class_type}
                      onChange={e => setFormData({...formData, class_type: e.target.value})}
                    >
                      <option>פילאטיס מכשירים</option>
                      <option>פילאטיס מזרן</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 mr-1">תאריך ושעה:</label>
                    <input 
                      type="datetime-local" 
                      required
                      style={{ colorScheme: 'light' }}
                      className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none min-h-[52px] block"
                      value={formData.start_time}
                      onChange={e => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg mt-4">
                    צור שיעור במערכת
                  </button>
                </form>
              </div>

              {/* רשימת השיעורים */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">שיעורים קיימים במערכת</h2>
                    <button onClick={loadData} className="text-sm text-slate-500 hover:underline">רענן רשימה ↻</button>
                </div>
                
                {isFetching ? (
                   <div className="space-y-3">
                     {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                   </div>
                ) : (
                  <div className="space-y-3">
                    {classes.map(c => (
                      <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            {new Date(c.start_time).toLocaleString('he-IL', {weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </p>
                          <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-[10px] rounded-full text-gray-600">{c.class_type}</span>
                        </div>
                        <button 
                          onClick={async () => { if(confirm("למחוק את השיעור?")) { await supabase?.from('classes').delete().eq('id', c.id); loadData(); } }} 
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          מחיקה
                        </button>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <div className="p-16 border-2 border-dashed border-gray-200 rounded-[2rem] text-center">
                        <p className="text-gray-400">אין עדיין שיעורים להצגה. הוסיפי את השיעור הראשון!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* טאב ניהול מתאמנות */
            <div className="bg-white rounded-[2rem] border border-gray-200 p-8 shadow-sm text-center">
               <h2 className="text-2xl font-bold mb-4 text-slate-800">רשימת המתאמנות שלך</h2>
               {isFetching ? <p className="text-gray-400">טוען רשימה...</p> : (
                 profiles.length === 0 ? (
                    <p className="text-gray-400 italic">טרם נרשמו מתאמנות לאתר</p>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-right">
                     {profiles.map(p => (
                       <div key={p.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                         <p className="font-bold text-slate-800">{p.full_name || 'ללא שם'}</p>
                         <p className="text-xs text-gray-500">{p.email || ''}</p>
                       </div>
                     ))}
                   </div>
                 )
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}