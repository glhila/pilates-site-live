'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'classes'>('profiles');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ניהול תאריכים לסינון שבועי
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 = ראשון
    const diff = d.getDate() - day; 
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: p } = await supabase.from('profiles').select('*').order('full_name');
    const { data: c } = await supabase.from('classes').select('*').order('start_time');
    const { data: b } = await supabase.from('bookings').select('*, profiles(full_name)');
    if (p) setProfiles(p);
    if (c) setClasses(c);
    if (b) setBookings(b);
    setLoading(false);
  };

  // פונקציות לדפדוף שבועות
  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const resetToToday = () => {
    const d = new Date();
    const start = new Date(d.setDate(d.getDate() - d.getDay()));
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  // סינון שיעורים לפי השבוע הנבחר
  const getFilteredClasses = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return classes.filter(c => {
      const classDate = new Date(c.start_time);
      return classDate >= currentWeekStart && classDate < weekEnd;
    });
  };

  const getClassesByDay = () => {
    const days: { [key: string]: any[] } = {
      'ראשון': [], 'שני': [], 'שלישי': [], 'רביעי': [], 'חמישי': [], 'שישי': [], 'שבת': []
    };
    
    getFilteredClasses().forEach(c => {
      const dayName = new Date(c.start_time).toLocaleDateString('he-IL', { weekday: 'long' }).replace('יום ', '');
      if (days[dayName]) days[dayName].push(c);
    });
    return days;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background font-sans text-foreground" dir="rtl">
      <div className="animate-pulse text-lg opacity-50 italic">טוען נתונים...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">STUDIO ADMIN</h1>
          
          <div className="flex bg-muted p-1 rounded-full border border-border">
            <button onClick={() => setActiveTab('profiles')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'profiles' ? 'bg-background shadow-sm' : 'opacity-50'}`}>מתאמנות</button>
            <button onClick={() => setActiveTab('classes')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'classes' ? 'bg-background shadow-sm' : 'opacity-50'}`}>מערכת שעות</button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {activeTab === 'profiles' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <h2 className="text-lg font-semibold mb-6 italic opacity-70">ניהול לקוחות</h2>
             <div className="grid grid-cols-1 gap-3">
                {profiles.map(p => (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center font-bold text-xs uppercase">{p.full_name?.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-sm">{p.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-6 items-center">
                      {!p.is_approved && (
                        <button onClick={() => supabase.from('profiles').update({is_approved: true}).eq('id', p.id).then(fetchData)} className="text-[10px] bg-foreground text-background px-3 py-1 rounded-full font-bold">אשרי מתאמנת</button>
                      )}
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">שבועי</p>
                        <p className="text-xs font-bold">{p.membership_type || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">יתרה</p>
                        <p className="text-xs font-bold">{p.punch_card_remaining || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* בקרת דפדוף ותצוגה */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-card border border-border p-4 rounded-2xl">
              <div className="flex items-center gap-4">
                <button onClick={prevWeek} className="p-2 hover:bg-muted rounded-full transition text-lg">←</button>
                <div className="text-center min-w-[200px]">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">השבוע של</p>
                  <p className="text-sm font-bold">
                    {currentWeekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <button onClick={nextWeek} className="p-2 hover:bg-muted rounded-full transition text-lg">→</button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={resetToToday} className="text-[10px] font-bold uppercase tracking-tight hover:underline ml-4">היום</button>
                <div className="flex bg-muted rounded-lg p-1 border border-border shadow-inner">
                  <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : 'opacity-40'}`}>רשימה</button>
                  <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'calendar' ? 'bg-background shadow-sm' : 'opacity-40'}`}>שבועי</button>
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredClasses().map(c => (
                  <div key={c.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">{c.class_type || 'PILATES'}</p>
                        <h3 className="text-lg font-bold">{c.name}</h3>
                        <p className="text-xs text-muted-foreground italic">עם {c.instructor_name}</p>
                      </div>
                      <div className="text-left font-mono text-xs opacity-40">#{c.id.slice(0,4)}</div>
                    </div>
                    <div className="flex gap-2 items-center mb-6">
                       <span className="text-xs font-bold">{new Date(c.start_time).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                       <span className="h-1 w-1 bg-border rounded-full"></span>
                       <span className="text-xs font-medium text-muted-foreground">{new Date(c.start_time).toLocaleDateString('he-IL', {weekday: 'short', day:'numeric', month:'numeric'})}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bookings.filter(b => b.class_id === c.id).map(b => (
                        <span key={b.id} className="text-[9px] bg-muted px-2 py-1 rounded-md border border-border font-medium italic">
                          {b.profiles?.full_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* תצוגה שבועית */
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {Object.entries(getClassesByDay()).map(([day, dayClasses]) => (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="text-center py-2 bg-muted/30 rounded-lg border border-border/50">
                      <span className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">{day}</span>
                    </div>
                    {dayClasses.map(c => (
                      <div key={c.id} className="bg-card p-3 rounded-xl border border-border shadow-sm hover:ring-1 ring-primary/30 transition-all cursor-default group">
                        <p className="text-[10px] font-black text-primary leading-tight">{new Date(c.start_time).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-[10px] font-bold truncate mt-1">{c.name}</p>
                        <div className="mt-2 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                           <span className="text-[8px] font-bold">{bookings.filter(b => b.class_id === c.id).length}/{c.max_capacity}</span>
                           <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                             <div className="h-full bg-primary" style={{width: `${(bookings.filter(b => b.class_id === c.id).length / c.max_capacity) * 100}%`}}></div>
                           </div>
                        </div>
                      </div>
                    ))}
                    {dayClasses.length === 0 && <div className="h-20 border border-dashed border-border/50 rounded-xl"></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}