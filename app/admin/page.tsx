'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// אתחול Supabase מחוץ לקומפוננטה
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

  // פונקציית טעינה פשוטה
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
      alert("השיעור נוסף!");
      setFormData({ ...formData, name: '', start_time: '' });
      loadData();
    }
  };

  // --- הממשק תמיד ירונדר כאן ---
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* כותרת וניווט טאבים */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-brand-stone/20 pb-6">
          <h1 className="text-4xl font-black text-brand-dark">ניהול הסטודיו ⚙️</h1>
          <div className="bg-brand-stone/10 p-1 rounded-2xl flex gap-1">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-dark/60'}`}
            >
              מערכת שעות
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-dark/60'}`}
            >
              ניהול מתאמנות
            </button>
          </div>
        </header>

        {/* תוכן הטאב הנבחר */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'schedule' ? (
            <div className="grid md:grid-cols-3 gap-8">
              {/* טופס הוספה - חייב להופיע */}
              <div className="md:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-brand-stone/20 h-fit">
                <h2 className="text-xl font-bold mb-6 text-brand-dark">הוספת שיעור</h2>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <input 
                    type="text" placeholder="שם השיעור (למשל: level 2)" required
                    className="w-full p-3 bg-brand-bg rounded-xl border-none text-sm focus:ring-1 ring-brand-primary"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <select 
                    className="w-full p-3 bg-brand-bg rounded-xl border-none text-sm"
                    value={formData.class_type}
                    onChange={e => setFormData({...formData, class_type: e.target.value})}
                  >
                    <option>פילאטיס מכשירים</option>
                    <option>פילאטיס מזרן</option>
                  </select>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full p-3 bg-brand-bg rounded-xl border-none text-sm text-brand-dark min-h-[50px] appearance-none block"
                    style={{ colorScheme: 'light' }} // זה מבטיח שהדפדפן יציג אייקונים כהים על רקע בהיר
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                  />
                  <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-brand-dark/10">
                    צור שיעור במערכת
                  </button>
                </form>
              </div>

              {/* רשימת השיעורים */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-bold mb-4 text-brand-dark">שיעורים קיימים במערכת</h2>
                {isFetching ? <p className="opacity-50 animate-pulse">מעדכן נתונים...</p> : (
                  <div className="space-y-3">
                    {classes.map(c => (
                      <div key={c.id} className="bg-white p-5 rounded-2xl border border-brand-stone/10 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-bold text-brand-dark">{c.name}</p>
                          <p className="text-xs opacity-60">{new Date(c.start_time).toLocaleString('he-IL', {weekday: 'long', hour: '2-digit', minute: '2-digit'})}</p>
                        </div>
                        <button onClick={async () => { if(confirm("למחוק?")) { await supabase?.from('classes').delete().eq('id', c.id); loadData(); } }} className="text-xs text-red-400 font-bold hover:underline">מחיקה</button>
                      </div>
                    ))}
                    {classes.length === 0 && <div className="p-10 border-2 border-dashed border-brand-stone/20 rounded-[2rem] text-center opacity-40">אין עדיין שיעורים להצגה</div>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* טאב ניהול מתאמנות */
            <div className="bg-white rounded-[2rem] border border-brand-stone/20 p-8 shadow-sm text-center">
               <h2 className="text-xl font-bold mb-4 text-brand-dark">רשימת המתאמנות שלך</h2>
               {isFetching ? <p className="opacity-50">טוען רשימה...</p> : (
                 profiles.length === 0 ? <p className="opacity-40 italic">טרם נרשמו מתאמנות לאתר</p> : (
                   <p className="text-sm font-medium">נמצאו {profiles.length} מתאמנות במערכת</p>
                 )
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}