'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// אתחול בטוח
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    class_type: 'פילאטיס מכשירים',
    start_time: '',
    max_capacity: 6
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (!supabase) {
        console.error("Supabase client not initialized - check your environment variables");
        setLoading(false);
        return;
    }
    
    setLoading(true);
    try {
      if (activeTab === 'schedule') {
        const { data, error } = await supabase.from('classes').select('*').order('start_time', { ascending: true });
        if (error) throw error;
        setClasses(data || []);
      } else {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProfiles(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    const { error } = await supabase.from('classes').insert([formData]);
    if (error) {
        alert("שגיאה ביצירת שיעור: " + error.message);
    } else {
      alert("השיעור נוסף בהצלחה!");
      setFormData({ ...formData, name: '', start_time: '' });
      fetchData();
    }
  };

  const updateUserStatus = async (userId: string, isApproved: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({ is_approved: isApproved }).eq('id', userId);
    if (!error) fetchData();
  };

  const updatePunches = async (userId: string, currentPunches: number, amount: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({ punch_card_remaining: currentPunches + amount }).eq('id', userId);
    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-brand-stone/20 pb-6">
          <div>
            <h1 className="text-4xl font-black text-brand-dark">ניהול הסטודיו ⚙️</h1>
            <p className="text-sm opacity-60 mt-1">ברוכה הבאה ללוח הבקרה של עונג פילאטיס</p>
          </div>
          
          <div className="bg-brand-stone/10 p-1 rounded-2xl flex gap-1">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-dark/60 hover:bg-brand-stone/5'}`}
            >
              מערכת שעות
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white shadow-sm' : 'text-brand-dark/60 hover:bg-brand-stone/5'}`}
            >
              ניהול מתאמנות
            </button>
          </div>
        </header>

        {loading && <div className="text-center py-20 opacity-50">טוען נתונים מהמערכת...</div>}

        {!loading && activeTab === 'schedule' && (
          <div className="grid md:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* טופס הוספה */}
            <div className="md:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-brand-stone/20 h-fit">
              <h2 className="text-xl font-bold mb-6">הוספת שיעור חדש</h2>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase mb-1 opacity-50">שם השיעור</label>
                    <input type="text" placeholder="למשל: בוקר חזק" className="w-full p-3 bg-brand-bg rounded-xl text-sm border-none focus:ring-1 ring-brand-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase mb-1 opacity-50">סוג</label>
                    <select className="w-full p-3 bg-brand-bg rounded-xl text-sm border-none" value={formData.class_type} onChange={e => setFormData({...formData, class_type: e.target.value})}>
                    <option>פילאטיס מכשירים</option>
                    <option>פילאטיס מזרן</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase mb-1 opacity-50">מועד</label>
                    <input type="datetime-local" className="w-full p-3 bg-brand-bg rounded-xl text-sm border-none" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                </div>
                <button type="submit" className="w-full bg-brand-dark text-white p-4 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform">צור שיעור במערכת</button>
              </form>
            </div>

            {/* רשימה */}
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-xl font-bold mb-4">שיעורים מוזנים</h2>
              {classes.length === 0 ? (
                  <div className="bg-white/50 border-2 border-dashed border-brand-stone/20 p-12 rounded-[2rem] text-center opacity-50">
                      אין עדיין שיעורים. השתמשי בטופס כדי להוסיף את השיעור הראשון.
                  </div>
              ) : (
                classes.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-2xl flex justify-between items-center border border-brand-stone/10 shadow-sm">
                      <div>
                        <h3 className="font-bold text-brand-dark">{c.name}</h3>
                        <p className="text-xs opacity-60">{new Date(c.start_time).toLocaleString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <button onClick={async () => { if(confirm("למחוק את השיעור?")) { await supabase?.from('classes').delete().eq('id', c.id); fetchData(); } }} className="text-xs text-red-400 font-bold hover:underline">מחיקה</button>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-brand-stone/20 overflow-hidden animate-in fade-in duration-500">
            <table className="w-full text-right text-sm">
              <thead className="bg-brand-bg text-brand-dark/50 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-5">מתאמנת</th>
                  <th className="p-5">סטטוס</th>
                  <th className="p-5">ניקובים</th>
                  <th className="p-5">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-stone/10">
                {profiles.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center opacity-50">טרם נרשמו מתאמנות לאתר</td></tr>
                ) : (
                    profiles.map(p => (
                    <tr key={p.id} className="hover:bg-brand-bg/30">
                        <td className="p-5 font-bold">{p.full_name || "משתמשת חדשה"}</td>
                        <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.is_approved ? 'מאושרת' : 'ממתינה לאישור'}
                        </span>
                        </td>
                        <td className="p-5 font-mono font-bold text-lg">{p.punch_card_remaining || 0}</td>
                        <td className="p-5 flex gap-2">
                        <button onClick={() => updatePunches(p.id, p.punch_card_remaining, 1)} className="bg-brand-bg p-2 rounded-lg hover:bg-brand-stone/20" title="הוסף ניקוב">➕</button>
                        <button onClick={() => updatePunches(p.id, p.punch_card_remaining, -1)} className="bg-brand-bg p-2 rounded-lg hover:bg-brand-stone/20" title="החסר ניקוב">➖</button>
                        <button 
                            onClick={() => updateUserStatus(p.id, !p.is_approved)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold ${p.is_approved ? 'text-red-500 border border-red-100' : 'bg-brand-dark text-white'}`}
                        >
                            {p.is_approved ? 'חסום' : 'אשר מתאמנת'}
                        </button>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}