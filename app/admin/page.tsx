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
  const [loading, setLoading] = useState(false); // התחלה כ-false כדי שהממשק לא ייתקע

  const [formData, setFormData] = useState({
    name: '',
    class_type: 'פילאטיס מכשירים',
    start_time: '',
    max_capacity: 6
  });

  // טעינת נתונים - פונקציה מבודדת
  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (activeTab === 'schedule') {
        const { data, error } = await supabase.from('classes').select('*').order('start_time', { ascending: true });
        if (!error) setClasses(data || []);
      } else {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error) setProfiles(data || []);
      }
    } catch (err) {
      console.error("Supabase error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return alert("חיבור ל-Supabase לא הוגדר כראוי");
    
    const { error } = await supabase.from('classes').insert([formData]);
    if (error) alert("שגיאה: " + error.message);
    else {
      alert("השיעור נוסף!");
      setFormData({ ...formData, name: '', start_time: '' });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* כותרת וניווט - תמיד מופיעים */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-brand-stone/20 pb-6">
          <div>
            <h1 className="text-4xl font-black text-brand-dark">ניהול הסטודיו ⚙️</h1>
          </div>
          
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

        {/* תוכן הטאבים */}
        {activeTab === 'schedule' ? (
          <div className="grid md:grid-cols-3 gap-8">
            {/* טופס - תמיד מופיע */}
            <div className="md:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-brand-stone/20 h-fit">
              <h2 className="text-xl font-bold mb-6">הוספת שיעור</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <input 
                  type="text" placeholder="שם השיעור" required
                  className="w-full p-3 bg-brand-bg rounded-xl border-none text-sm"
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
                  type="datetime-local" required
                  className="w-full p-3 bg-brand-bg rounded-xl border-none text-sm"
                  value={formData.start_time}
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                />
                <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-xl font-bold">
                  צור שיעור
                </button>
              </form>
            </div>

            {/* רשימת שיעורים */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold mb-4">שיעורים קיימים</h2>
              {loading ? <p className="opacity-50">טוען...</p> : (
                <div className="space-y-3">
                  {classes.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-2xl border border-brand-stone/10 flex justify-between">
                      <span>{c.name} - {new Date(c.start_time).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))}
                  {classes.length === 0 && <p className="text-sm opacity-50 italic">אין עדיין שיעורים במערכת.</p>}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* טאב משתמשים */
          <div className="bg-white rounded-[2rem] border border-brand-stone/20 p-6 shadow-sm">
             <h2 className="text-xl font-bold mb-4">רשימת מתאמנות</h2>
             {loading ? <p>טוען מתאמנות...</p> : (
               profiles.length === 0 ? <p className="opacity-50 italic">טרם נרשמו מתאמנות.</p> : <p>כאן תופיע טבלת המתאמנות.</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
}