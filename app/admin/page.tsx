'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  ADMIN_EMAILS,
  DAYS_HEBREW, TIME_SLOTS, HOUR_HEIGHT, MORNING_START, MORNING_END,
  CLASS_TEMPLATES,
  HEALTH_FORM_URL,
  DEFAULT_PUNCH_FOR_PUNCH_CARD_ONLY,
  PUNCH_CARD_PACKAGE_SIZES,
  PUNCH_CARD_VALIDITY_RULES,
  getAuthenticatedSupabase, getWhatsAppUrlForPhone, toDateKey, fetchJewishHolidays, type HolidayMap,
} from "@/src/lib/constants";
import { WhatsAppIcon } from "@/src/components/icons";

const PUNCH_PRESET_VALUES = [0, ...PUNCH_CARD_PACKAGE_SIZES] as const;

type UserFormState = {
  full_name: string;
  email: string;
  phone: string;
  membership_type: number;
  punch_card_remaining: number;
  punch_card_expiry: string;
};

const profileToUserForm = (p: any): UserFormState => ({
  full_name: p.full_name ?? '',
  email: p.email ?? '',
  phone: p.phone ?? '',
  membership_type: Number(p.membership_type) || 0,
  punch_card_remaining: Number(p.punch_card_remaining) || 0,
  punch_card_expiry: p.punch_card_expiry ? String(p.punch_card_expiry).slice(0, 10) : '',
});

const applyPunchChange = (
  prev: UserFormState,
  newPunches: number
): UserFormState => {
  const toDateOnly = (d: Date) => d.toISOString().split('T')[0];
  const updates: Partial<UserFormState> = { punch_card_remaining: newPunches };

  if (newPunches === 0) {
    updates.punch_card_expiry = '';
    return { ...prev, ...updates };
  }

  const validity = PUNCH_CARD_VALIDITY_RULES[newPunches];
  if (validity) {
    const d = new Date();
    if (validity.weeks) d.setDate(d.getDate() + validity.weeks * 7);
    if (validity.months) d.setMonth(d.getMonth() + validity.months);
    updates.punch_card_expiry = toDateOnly(d);
  }

  return { ...prev, ...updates };
};

const CLASS_DURATION_MINUTES = 60;
const [DEFAULT_HOUR, DEFAULT_MINUTE] = TIME_SLOTS[0].split(":");
const toLocalDateTimeString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}:00`;
};
const getSlotKeyFromStartTime = (startTime: string): string | null => {
  const fromIso = String(startTime).match(/T(\d{2}:\d{2})/);
  if (fromIso?.[1]) return fromIso[1];
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // ─── State: tab & data ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'schedule' | 'users'>('schedule');
  const [classes, setClasses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // ─── State: date navigation (schedule view) ───────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateMobile, setSelectedDateMobile] = useState(new Date());

  // ─── State: modals ───────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; classItem: any } | null>(null);
  const [detailsModal, setDetailsModal] = useState<any | null>(null);
  const [welcomeModal, setWelcomeModal] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [overlapModal, setOverlapModal] = useState<null | {
    pendingInsert: any[];
    conflicts: any[];
    dayLabel: string;
    suggestions: { hour: string; minute: string; label: string }[];
    isRecurring: boolean;
  }>(null);

  // ─── State: add-class form ────────────────────────────────────────────────
  const [classFormData, setClassFormData] = useState<{
    name: string; date: string; hour: string; minute: string; max_capacity: number; is_recurring: boolean;
  }>({
    name: CLASS_TEMPLATES[0], date: '', hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE, max_capacity: 3, is_recurring: false
  });

  // ─── State: user/trainee form & manual booking ────────────────────────────
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormState>({
    full_name: '', email: '', phone: '', membership_type: 0, punch_card_remaining: 0, punch_card_expiry: ''
  });

  /** מתאמנת חדשה בלבד: ניקובים ברירת מחדל — 0 במנוי שבועי, חבילת ברירת מחדל בכרטיסייה בלבד (לפי מחירון). */
  useEffect(() => {
    if (editingUserId) return;
    const nextPunch =
      userFormData.membership_type > 0 ? 0 : DEFAULT_PUNCH_FOR_PUNCH_CARD_ONLY;
    setUserFormData((prev) => {
      if (prev.punch_card_remaining === nextPunch) return prev;
      return applyPunchChange(prev, nextPunch);
    });
  }, [userFormData.membership_type, editingUserId]);
  const [manualBookingUserId, setManualBookingUserId] = useState("");
  const [jewishHolidaysByDate, setJewishHolidaysByDate] = useState<HolidayMap>({});

  // ─── Supabase & data loading ─────────────────────────────────────────────
  const loadData = async () => {
    setIsFetching(true);
    const supabase = await getAuthenticatedSupabase(getToken);
    if (!supabase) { setIsFetching(false); return; }
    try {
      const { data: cls } = await supabase.from('classes').select('*, bookings!class_id(id, profiles(id, full_name, email, phone))').order('start_time');
      setClasses(cls || []);
      const { data: profs } = await supabase.from('profiles').select('*').neq('role', 'admin').order('full_name', { ascending: true });
      setProfiles(profs || []);
    } catch (e) { console.error(e); }
    setIsFetching(false);
  };

  useEffect(() => { if (isLoaded && user) loadData(); }, [activeTab, isLoaded, user]);

  // ─── Handlers: classes / schedule ─────────────────────────────────────────
  const toLocalDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getInterval = (startIso: string) => {
    const start = new Date(startIso);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + CLASS_DURATION_MINUTES);
    return { start, end };
  };

  const intervalsOverlap = (a: { start: Date; end: Date }, b: { start: Date; end: Date }) =>
    a.start < b.end && b.start < a.end;

  const getDayConflicts = (candidateStartIso: string) => {
    const candidate = getInterval(candidateStartIso);
    const dayKey = toLocalDayKey(candidate.start);
    return classes
      .filter(c => toLocalDayKey(new Date(c.start_time)) === dayKey)
      .filter(c => intervalsOverlap(candidate, getInterval(c.start_time)));
  };

  const getFreeSlotsForDay = (dayKey: string) => {
    const existing = classes
      .filter(c => toLocalDayKey(new Date(c.start_time)) === dayKey)
      .map(c => getInterval(c.start_time));

    return TIME_SLOTS
      .map((slot) => {
        const [hour, minute] = slot.split(":");
        return { hour, minute, label: slot };
      })
      .filter(({ hour, minute }) => {
        const start = new Date(`${dayKey}T${hour}:${minute}:00`);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + CLASS_DURATION_MINUTES);

        const rangeStart = new Date(`${dayKey}T${String(MORNING_START).padStart(2, '0')}:00:00`);
        const rangeEnd = new Date(`${dayKey}T${String(MORNING_END + 1).padStart(2, '0')}:00:00`);
        if (!(start >= rangeStart && end <= rangeEnd)) return false;

        const candidateInterval = { start, end };
        return !existing.some(ex => intervalsOverlap(candidateInterval, ex));
      });
  };

  const getClosestSlots = (
    slots: { hour: string; minute: string; label: string }[],
    targetHour: string,
    targetMinute: string,
    limit = 12
  ) => {
    const targetMinutes = parseInt(targetHour, 10) * 60 + parseInt(targetMinute, 10);
    return [...slots]
      .sort((a, b) => {
        const aMinutes = parseInt(a.hour, 10) * 60 + parseInt(a.minute, 10);
        const bMinutes = parseInt(b.hour, 10) * 60 + parseInt(b.minute, 10);
        const aDiff = Math.abs(aMinutes - targetMinutes);
        const bDiff = Math.abs(bMinutes - targetMinutes);
        if (aDiff !== bDiff) return aDiff - bDiff;
        return aMinutes - bMinutes;
      })
      .slice(0, limit);
  };

  const deleteClassesByIds = async (ids: string[]) => {
    const supabase = await getAuthenticatedSupabase(getToken);
    if (!supabase) return { ok: false as const, message: "אין חיבור למסד הנתונים" };
    const { error } = await supabase.from('classes').delete().in('id', ids);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase(getToken);
    if (!supabase) return;

    const fullDateStr = `${classFormData.date}T${classFormData.hour}:${classFormData.minute}:00`;
    const startDate = new Date(fullDateStr);
    const classesToInsert = [];
    const iterations = classFormData.is_recurring ? 52 : 1;
    const recurring_id = classFormData.is_recurring ? crypto.randomUUID() : null;

    for (let i = 0; i < iterations; i++) {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + (i * 7));
        classesToInsert.push({
            name: classFormData.name,
            class_type: classFormData.name.includes("מזרן") ? "פילאטיס מזרן" : "פילאטיס מכשירים",
            start_time: toLocalDateTimeString(currentStart),
            max_capacity: classFormData.max_capacity,
            recurring_id: recurring_id
        });
    }

    // Overlap detection (client-side, based on loaded `classes`)
    const conflicts = classesToInsert.flatMap(ci => getDayConflicts(ci.start_time).map(c => ({ ...c, _conflictFor: ci.start_time })));
    if (conflicts.length > 0) {
      const firstCandidateStart = new Date(classesToInsert[0].start_time);
      const dayKey = toLocalDayKey(firstCandidateStart);
      const suggestions = getClosestSlots(
        getFreeSlotsForDay(dayKey),
        classFormData.hour,
        classFormData.minute
      );
      const dayLabel = firstCandidateStart.toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      setOverlapModal({
        pendingInsert: classesToInsert,
        conflicts,
        dayLabel,
        suggestions,
        isRecurring: !!classFormData.is_recurring,
      });
      return;
    }

    const { error } = await supabase.from('classes').insert(classesToInsert);
    if (error) alert(error.message);
    else { alert("השיעור/ים נוספו בהצלחה!"); loadData(); }
  };

  const processDeletion = async (type: 'single' | 'future') => {
    if (!deleteModal) return;
    const { classItem } = deleteModal;
    const supabase = await getAuthenticatedSupabase(getToken);
    let query = supabase!.from('classes').delete();
    if (type === 'single' || !classItem.recurring_id) {
        query = query.eq('id', classItem.id);
    } else {
        query = query.eq('recurring_id', classItem.recurring_id).gte('start_time', classItem.start_time);
    }
    await query;
    setDeleteModal(null);
    loadData();
  };

  const handleManualBooking = async () => {
    if (!manualBookingUserId || !detailsModal) return;
    const supabase = await getAuthenticatedSupabase(getToken);
    const selectedUser = profiles.find(p => p.id === manualBookingUserId);
    
    // בדיקת מכסה למנהלת (לצורך התראה בלבד)
    const classWeekStart = new Date(detailsModal.start_time);
    classWeekStart.setDate(classWeekStart.getDate() - classWeekStart.getDay());
    const count = classes.filter(c => {
        const d = new Date(c.start_time);
        return d.getDate() - d.getDay() === classWeekStart.getDate() - classWeekStart.getDay() && 
               c.bookings?.some((b: any) => b.profiles?.id === manualBookingUserId);
    }).length;

    if (selectedUser?.membership_type > 0 && count >= selectedUser.membership_type) {
        if (!confirm(`שימי לב: למתאמנת נגמרה המכסה השבועית (${selectedUser.membership_type} אימונים). האם לרשום אותה בכל זאת?`)) return;
    }

    const { error } = await supabase!.from('bookings').insert({
        user_id: manualBookingUserId, 
        class_id: detailsModal.id, 
        payment_source: 'admin_manual'
    });

    if (error) {
        let friendlyMessage = "חלה שגיאה לא צפויה ברישום";
        if (error.code === '23505') {
            friendlyMessage = "המתאמנת כבר רשומה לשיעור זה ✨";
        } else if (error.message.includes('מכסת האימונים')) {
            friendlyMessage = "לא ניתן לרשום: המתאמנת עברה את המכסה השבועית שלה.";
        } else if (error.code === '42501') {
            friendlyMessage = "אין לך הרשאה לבצע פעולה זו.";
        } else {
            friendlyMessage = `שגיאה טכנית: ${error.message}`;
        }
        alert(friendlyMessage);
    } else { 
        alert("הרישום בוצע בהצלחה! 💪");
        setDetailsModal(null); 
        setManualBookingUserId(""); 
        loadData(); 
    }
  };

  const handleRemoveAttendee = async (bookingId: string) => {
    if (!confirm("להסיר מהשיעור?")) return;
    const supabase = await getAuthenticatedSupabase(getToken);
    await supabase?.from('bookings').delete().eq('id', bookingId);
    setDetailsModal(null);
    loadData();
  };

  // ─── Handlers: users / trainees ──────────────────────────────────────────
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = await getAuthenticatedSupabase(getToken);
    if (!supabase) return;

    // התאריך נקבע ישירות בטופס — אין צורך בחישוב אוטומטי כאן
    const payload = { 
        full_name: userFormData.full_name,
        email: userFormData.email.trim().toLowerCase(),
        phone: userFormData.phone,
        membership_type: userFormData.membership_type,
        punch_card_remaining: userFormData.punch_card_remaining,
        punch_card_expiry: userFormData.punch_card_expiry || null,
        updated_at: new Date().toISOString() 
    };
    
    const { error } = editingUserId 
        ? await supabase.from('profiles').update(payload).eq('id', editingUserId)
        : await supabase.from('profiles').insert([{ ...payload, is_approved: true }]);
    
    if (error) {
        alert("שגיאה בשמירה: " + error.message);
    } else {
        const isNew = !editingUserId;
        const savedName = userFormData.full_name;
        const savedEmail = userFormData.email.trim().toLowerCase();
        const savedPhone = userFormData.phone;
        setEditingUserId(null); 
        setUserFormData({ full_name: '', email: '', phone: '', membership_type: 0, punch_card_remaining: 0, punch_card_expiry: '' }); 
        loadData();
        if (isNew) {
          setWelcomeModal({ name: savedName, email: savedEmail, phone: savedPhone });
        } else {
          alert("פרטי המתאמנת עודכנו בהצלחה");
        }
    }
  };

  const getMailtoUrl = (name: string, email: string) => {
    const subject = encodeURIComponent(`ברוכה הבאה ל-עונג של פילאטיס 🌸`);
    const body = encodeURIComponent(
      `היי ${name} 😊\n\nשמחים שהצטרפת אלינו!\n\nלפני האימון הראשון, נבקש ממך למלא הצהרת בריאות קצרה - זה לוקח רק דקה ✨\n\n👉 ${HEALTH_FORM_URL}\n\nמחכים לראותך!\nצוות עונג של פילאטיס 🤍`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const getWhatsAppUrl = (phone: string, name: string) =>
    getWhatsAppUrlForPhone(
      phone,
      `היי ${name} 🌸\n\nברוכה הבאה ל-עונג של פילאטיס!\n\nלפני האימון הראשון, נבקש ממך למלא הצהרת בריאות קצרה - זה לוקח רק דקה ✨\n\n👉 ${HEALTH_FORM_URL}\n\nמחכים לראותך! 🤍`
    );

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("למחוק מתאמנת לצמיתות?")) return;
    const supabase = await getAuthenticatedSupabase(getToken);
    await supabase?.from('profiles').delete().eq('id', id);
    loadData();
  };

  // ─── Computed: week dates for calendar ────────────────────────────────────
  const weekDates = useMemo(() => {
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }, [viewDate]);

  useEffect(() => {
    const years = Array.from(new Set(weekDates.map((d) => d.getFullYear())));
    let cancelled = false;
    fetchJewishHolidays(years)
      .then((map) => { if (!cancelled) setJewishHolidaysByDate(map); })
      .catch(() => { if (!cancelled) setJewishHolidaysByDate({}); });
    return () => { cancelled = true; };
  }, [weekDates]);

  // ─── Guard: admin-only access ─────────────────────────────────────────────
  if (isLoaded && !ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress || '')) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center font-bold text-red-500">אין לך הרשאת גישה לדף זה.</div>;
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-brand-bg font-sans text-brand-dark"
      dir="rtl"
    >
      <div className="container mx-auto px-6 py-20 max-w-6xl">

        {/* ─── Header: title + tab switcher (Schedule / Users) ─────────────── */}
        <header className="mb-12 rounded-[3rem] bg-white p-8 shadow-sm border border-brand-stone/20 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center lg:text-right">
            <span className="mb-2 block text-[10px] font-bold tracking-[0.4em] uppercase text-brand-accent-text">
              Studio Backend • Admin
            </span>
            <h1 className="hero-title text-3xl sm:text-4xl text-brand-primary">
              ניהול <span className="luxury-italic text-brand-accent-text">הסטודיו</span>
            </h1>
            <p className="max-w-md text-sm font-light text-brand-primary/70 italic mx-auto lg:mx-0">
              איזון בין דיוק תפעולי לשקט בראש – כל מה שהסטודיו צריך במקום אחד.
            </p>
          </div>

          <div className="flex bg-brand-stone/5 p-2 rounded-[2.5rem] border border-brand-stone/10 shadow-inner">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-8 sm:px-10 py-3 rounded-3xl font-bold text-sm sm:text-base transition-all ${
                activeTab === 'schedule'
                  ? 'bg-brand-dark text-white shadow-xl scale-[1.02]'
                  : 'text-brand-dark/50 hover:text-brand-dark'
              }`}
            >
              מערכת שעות
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-8 sm:px-10 py-3 rounded-3xl font-bold text-sm sm:text-base transition-all ${
                activeTab === 'users'
                  ? 'bg-brand-dark text-white shadow-xl scale-[1.02]'
                  : 'text-brand-dark/50 hover:text-brand-dark'
              }`}
            >
              ניהול מתאמנות
            </button>
          </div>
        </header>

        {/* ─── Tab: Schedule ───────────────────────────────────────────────── */}
        {activeTab === 'schedule' ? (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Schedule sidebar: add-class form */}
            <div className="w-full lg:col-span-4 bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit lg:sticky lg:top-10 z-20">
              <h2 className="text-2xl font-bold mb-6 sm:mb-10 italic">הוספת שיעור</h2>
              <form onSubmit={handleCreateClass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">סוג ורמה</label>
                  <select className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold border border-brand-stone/10" value={classFormData.name} onChange={e => setClassFormData({...classFormData, name: e.target.value})}>
                    {CLASS_TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">תאריך</label>
                  <input type="date" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={classFormData.date} onChange={e => setClassFormData({...classFormData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">שעה</label>
                  <select
                    className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold"
                    value={`${classFormData.hour}:${classFormData.minute}`}
                    onChange={e => {
                      const [hour, minute] = e.target.value.split(':');
                      setClassFormData({ ...classFormData, hour, minute });
                    }}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">קיבולת מקסימלית</label>
                    <input type="number" className="w-full p-4 bg-brand-bg rounded-2xl outline-none font-bold border border-brand-stone/10" value={classFormData.max_capacity} onChange={e => setClassFormData({...classFormData, max_capacity: parseInt(e.target.value)})} />
                </div>
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-brand-stone/5 rounded-3xl border border-dashed border-brand-stone/20 transition-all hover:bg-brand-stone/10">
                    <input type="checkbox" className="w-6 h-6 accent-brand-dark" checked={classFormData.is_recurring} onChange={e => setClassFormData({...classFormData, is_recurring: e.target.checked})} />
                    <span className="text-sm font-bold">שיעור קבוע לשנה 🗓️</span>
                </label>
                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.01]">הוספה</button>
              </form>
            </div>

            {/* Schedule main: week navigator + desktop grid + mobile list */}
            <div className="w-full lg:col-span-8">
                {/* Week navigator — desktop */}
                <div className="hidden lg:flex justify-center mb-6">
                  <div className="flex items-center gap-4 bg-brand-stone/5 p-3 rounded-3xl border border-brand-stone/10">
                    <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold" aria-label="שבוע קודם">→</button>
                    <span className="font-bold text-sm min-w-[200px] text-center tabular-nums">
                      {weekDates[0].toLocaleDateString('he-IL')} - {weekDates[5].toLocaleDateString('he-IL')}
                    </span>
                    <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold" aria-label="שבוע הבא">←</button>
                  </div>
                </div>

                {/* Desktop: 7-day grid with time slots */}
                <div className="hidden lg:flex bg-white rounded-[3.5rem] border border-brand-stone/20 overflow-hidden shadow-sm min-h-[950px]">
                  <div className="w-20 bg-brand-stone/5 border-l border-brand-stone/10 flex flex-col pt-20 text-[12px] opacity-50 font-serif italic font-black tabular-nums">
                    {TIME_SLOTS.map((s, i) => <div key={i} className="h-[100px] flex justify-center">{s}</div>)}
                  </div>
                  <div className="flex-1 grid grid-cols-6 relative">
                    {weekDates.map((date, dayIdx) => (
                      <div key={dayIdx} className={`relative border-l border-brand-stone/5 last:border-l-0 ${date.toDateString() === new Date().toDateString() ? 'bg-brand-dark/[0.02]' : ''}`}>
                        <div className="h-20 flex flex-col items-center justify-center border-b border-brand-stone/10 bg-white sticky top-0 z-20">
                            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{DAYS_HEBREW[dayIdx]}</span>
                            <span className="text-xl font-bold mt-0.5">{date.getDate()}</span>
                            {(() => {
                              const dateKey = toDateKey(date);
                              const jewish = jewishHolidaysByDate[dateKey] ?? [];
                              const label = jewish.slice(0, 1).join(" • ");
                              return label ? (
                                <span className="mt-0.5 text-[9px] font-semibold text-brand-accent-text/80 truncate max-w-[90%]">
                                  {label}
                                </span>
                              ) : null;
                            })()}
                        </div>

                        <div className="relative" style={{ height: `${TIME_SLOTS.length * HOUR_HEIGHT}px` }}>
                          {classes.filter(c => new Date(c.start_time).toDateString() === date.toDateString()).map(c => {
                              const slotTime = getSlotKeyFromStartTime(c.start_time);
                              if (!slotTime) return null;
                              const slotIndex = TIME_SLOTS.indexOf(slotTime as (typeof TIME_SLOTS)[number]);
                              if (slotIndex < 0) return null;
                              const top = slotIndex * HOUR_HEIGHT;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => setDetailsModal(c)}
                                  className="absolute inset-x-1.5 h-[88px] cursor-pointer z-10 transition-transform hover:scale-[1.02]"
                                  style={{ top: `${top}px` }}
                                >
                                  <div className={`h-full px-3 py-2 sm:px-4 sm:py-3 rounded-[1.6rem] border flex flex-col justify-between shadow-sm bg-brand-bg-soft/90 overflow-hidden ${c.recurring_id ? 'border-brand-dark/25' : 'border-brand-stone/30'}`}>
                                  <div className="flex flex-col mb-1 leading-tight">
                                    <span className="text-[9px] font-bold text-brand-stone uppercase tracking-[0.2em]">{c.class_type}</span>
                                    <h3 className="mt-0.5 text-[13px] sm:text-[14px] font-semibold italic tracking-tight text-brand-dark line-clamp-1">
                                      {c.name.includes(" - ") ? c.name.split(" - ")[1] : c.name}
                                    </h3>
                                  </div>
                                  <div className="mt-auto flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-semibold text-brand-stone uppercase tracking-[0.16em]">{c.bookings?.length || 0}/{c.max_capacity} רשומות</span>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeleteModal({show: true, classItem: c}); }} 
                                      className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                      <span className="text-sm">🗑</span>
                                    </button>
                                  </div>
                                  </div>
                                </div>
                              );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile: week nav + date pills + class list by day */}
                <div className="flex lg:hidden flex-col w-full space-y-8">
                    {/* Week navigator — mobile */}
                    <div className="flex justify-center">
                      <div className="flex items-center gap-4 bg-brand-stone/5 p-3 rounded-3xl border border-brand-stone/10 w-full justify-center">
                        <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold" aria-label="שבוע קודם">→</button>
                        <span className="font-bold text-sm min-w-[160px] text-center tabular-nums">
                          {weekDates[0].toLocaleDateString('he-IL')} - {weekDates[5].toLocaleDateString('he-IL')}
                        </span>
                        <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d); }} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all font-bold" aria-label="שבוע הבא">←</button>
                      </div>
                    </div>

                    <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar px-1">
                        {weekDates.map((date, i) => (
                            <button key={i} onClick={() => setSelectedDateMobile(date)} className={`flex-shrink-0 w-16 h-24 rounded-[2rem] flex flex-col items-center justify-center border transition-all ${date.toDateString() === selectedDateMobile.toDateString() ? 'bg-brand-dark text-white border-brand-dark shadow-xl scale-105' : 'bg-white border-brand-stone/10'}`}>
                                <span className="text-[10px] font-black uppercase opacity-40">{DAYS_HEBREW[i]}</span>
                                <span className="text-2xl font-black mt-1">{date.getDate()}</span>
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4 px-1">
                      {classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).length > 0 ? (
                          classes.filter(c => new Date(c.start_time).toDateString() === selectedDateMobile.toDateString()).map(c => (
                              <div key={c.id} onClick={() => setDetailsModal(c)} className="bg-white p-6 rounded-[2.5rem] border border-brand-stone/10 flex justify-between items-center shadow-sm w-full transition-all active:scale-[0.98]">
                                  <div className="flex-1">
                                      <span className="text-[10px] font-black bg-brand-bg px-3 py-1 rounded-full uppercase tracking-widest text-brand-dark/60">
                                          {new Date(c.start_time).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                                      </span>
                                      <div className="mt-4 flex flex-col leading-tight">
                                          <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{c.class_type}</span>
                                          <h3 className="font-extrabold text-xl italic tracking-tight text-brand-dark mt-1">
                                              {c.name.includes(" - ") ? c.name.split(" - ")[1] : c.name}
                                          </h3>
                                      </div>
                                  </div>
                                  <div className="text-left flex flex-col items-end gap-5">
                                      <span className="text-[10px] font-black opacity-30 whitespace-nowrap uppercase tracking-tighter">{c.bookings?.length || 0}/{c.max_capacity} רשומות</span>
                                      <button onClick={(e) => { e.stopPropagation(); setDeleteModal({show: true, classItem: c}); }} className="text-red-400 text-[10px] font-black uppercase underline decoration-red-100 underline-offset-8 tracking-widest transition-colors active:text-red-600">
                                          ביטול שיעור 🗑
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-20 opacity-30 italic text-sm bg-white/50 rounded-[2.5rem] border border-dashed border-brand-stone/30">
                              אין אימונים מתוכננים ליום זה 🧘‍♀️
                          </div>
                      )}
                  </div>
                </div>
            </div>
          </div>
        ) : (
          /* ─── Tab: Users (trainees) ──────────────────────────────────────── */
          <div className="grid lg:grid-cols-12 gap-10">

            {/* Users sidebar: add/edit trainee form */}
            <div className="lg:col-span-4 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-brand-stone/20 h-fit lg:sticky lg:top-10 z-20">
              <h2 className="text-2xl font-bold mb-10 italic">{editingUserId ? 'עריכת מתאמנת' : 'מתאמנת חדשה'}</h2>
              <form onSubmit={handleSaveUser} className="space-y-6">

                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">שם מלא</label>
                  <input type="text" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.full_name} onChange={e => setUserFormData({...userFormData, full_name: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">אימייל</label>
                  <input type="email" required className="w-full p-4 bg-brand-bg rounded-2xl outline-none" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">מספר טלפון</label>
                  <input type="tel" placeholder="05X-XXXXXXX" className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10" value={userFormData.phone} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">מנוי שבועי</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-4 bg-brand-bg rounded-2xl"
                      value={userFormData.membership_type}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setUserFormData({ ...userFormData, membership_type: Number.isNaN(v) ? 0 : v });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">ניקובים</label>
                    <div className="flex flex-wrap gap-2">
                      {PUNCH_PRESET_VALUES.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setUserFormData((prev) => applyPunchChange(prev, n))}
                          className={`min-w-[2.5rem] px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                            userFormData.punch_card_remaining === n
                              ? 'bg-brand-dark text-white border-brand-dark'
                              : 'bg-white border-brand-stone/15 text-brand-primary/70 hover:border-brand-stone/40'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-4 bg-brand-bg rounded-2xl"
                      list="admin-punch-presets"
                      value={userFormData.punch_card_remaining}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const newPunches = raw === '' ? 0 : parseInt(raw, 10);
                        if (raw !== '' && Number.isNaN(newPunches)) return;
                        setUserFormData((prev) =>
                          applyPunchChange(prev, Number.isNaN(newPunches) ? 0 : newPunches)
                        );
                      }}
                    />
                    <datalist id="admin-punch-presets">
                      {PUNCH_PRESET_VALUES.map((n) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* שדה תוקף כרטיסייה — מוצג כאשר יש ניקובים או תוקף קיים */}
                {(userFormData.punch_card_remaining > 0 || userFormData.punch_card_expiry) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-30 uppercase block mr-1 tracking-widest">תוקף כרטיסייה</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-brand-bg rounded-2xl outline-none border border-brand-stone/10 text-brand-dark"
                      value={userFormData.punch_card_expiry || ''}
                      onChange={e => setUserFormData({ ...userFormData, punch_card_expiry: e.target.value })}
                    />
                    {/* קיצורי דרך לתאריך — שבוע / חודשיים / 3 חודשים (כמו במחירון) */}
                    <div className="flex gap-2 pt-1">
                      {(
                        [
                          { label: 'שבוע', weeks: 1 as const },
                          { label: 'חודשיים', months: 2 as const },
                          { label: '3 חודשים', months: 3 as const },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            if ('weeks' in item) d.setDate(d.getDate() + item.weeks * 7);
                            else d.setMonth(d.getMonth() + item.months);
                            setUserFormData((prev) => ({
                              ...prev,
                              punch_card_expiry: d.toISOString().split('T')[0],
                            }));
                          }}
                          className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-brand-bg hover:bg-brand-stone/10 transition-all opacity-50 hover:opacity-100"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-brand-dark text-white p-5 rounded-2xl font-bold shadow-2xl transition-all hover:scale-[1.01]">
                  {editingUserId ? 'עדכן פרטים' : 'הוספה למערכת'}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={() => { setEditingUserId(null); setUserFormData({ full_name: '', email: '', phone: '', membership_type: 0, punch_card_remaining: 0, punch_card_expiry: '' }); }}
                    className="w-full text-xs font-bold opacity-30 mt-4 underline underline-offset-4 tracking-widest"
                  >
                    ביטול עריכה
                  </button>
                )}
              </form>
            </div>

            {/* Users main: desktop table + mobile cards */}
            <div className="lg:col-span-8 space-y-6">

                {/* Desktop: users table */}
                <section className="hidden md:block">
                  <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="text-2xl font-serif text-brand-primary">מתאמנות רשומות</h2>
                    <p className="text-[11px] tracking-[0.25em] uppercase text-brand-stone">{profiles.length} פרופילים במערכת</p>
                  </div>

                  <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-stone/30 bg-white/30 backdrop-blur-sm shadow-[0_20px_50px_rgba(62,69,55,0.05)] w-full">
                    <table className="w-full text-right border-collapse table-auto">
                        <thead>
                            <tr className="border-b border-brand-stone/20 bg-brand-bg-soft/50 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-primary/80">
                                <th className="py-5 px-6 w-[22%] text-right">שם המתאמנת</th>
                                <th className="py-5 px-4 w-[24%] text-right">אימייל</th>
                                <th className="py-5 px-4 w-[16%] text-right">טלפון</th>
                                <th className="py-5 px-4 w-[14%] text-center">מנוי שבועי</th>
                                <th className="py-5 px-4 w-[14%] text-center">כרטיסייה</th>
                                <th className="py-5 px-4 w-[10%] text-center">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-light text-brand-primary/80">
                            {profiles.filter(p => p.role !== 'admin').map(p => (
                                <tr key={p.id} className="border-b border-brand-stone/15 last:border-b-0 hover:bg-white/60 transition-colors group">
                                    <td className="py-5 px-6 align-top">
                                        <p className="font-serif text-lg text-brand-primary leading-tight">{p.full_name}</p>
                                    </td>
                                    <td className="py-5 px-4 align-top">
                                        <p className="text-xs tracking-wide text-brand-primary/60 tabular-nums break-all max-w-[220px]">{p.email}</p>
                                    </td>
                                    <td className="py-5 px-4 align-top">
                                        {p.phone ? (
                                            <div className="flex items-center gap-2 group-hover:scale-105 transition-transform origin-right">
                                                <span className="tabular-nums text-xs font-medium text-brand-primary/80">{p.phone}</span>
                                                <a 
                                                    href={getWhatsAppUrlForPhone(p.phone, '')} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="w-7 h-7 flex items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600 hover:bg-green-100 shadow-sm"
                                                >
                                                    <span><WhatsAppIcon className="w-4 h-4 shrink-0" /></span>
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="opacity-30 text-[10px] italic">לא הוזן</span>
                                        )}
                                    </td>
                                    <td className="py-5 px-4 align-top text-center">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-bg-soft px-3 py-1 text-[11px] font-semibold text-brand-primary/80">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent-text" />
                                            <span>{p.membership_type} אימונים</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 align-top text-center">
                                        <div className="flex flex-col items-center gap-1">
                                          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold whitespace-nowrap border ${p.punch_card_remaining > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            <span className="tabular-nums">{p.punch_card_remaining}</span>
                                            <span>ניקובים</span>
                                          </span>
                                          {p.punch_card_expiry && (
                                            <span className="text-[9px] opacity-40 tabular-nums">
                                              עד {new Date(p.punch_card_expiry).toLocaleDateString('he-IL', {day:'2-digit', month:'2-digit', year:'numeric'})}
                                            </span>
                                          )}
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 align-top">
                                        <div className="flex gap-3 justify-center items-center text-[10px] font-bold tracking-[0.18em] uppercase">
                                            <button onClick={() => { setEditingUserId(p.id); setUserFormData(profileToUserForm(p)); }} className="text-brand-primary/50 hover:text-brand-primary transition-colors">עריכה ✎</button>
                                            <span className="h-3 w-px bg-brand-stone/30" />
                                            <button onClick={() => handleDeleteProfile(p.id)} className="text-red-300 hover:text-red-600 transition-colors">מחקי 🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </section>

                {/* Mobile: user cards */}
                <div className="grid md:hidden gap-4 pb-20">
                  {profiles.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-brand-stone/10 shadow-sm relative">
                          <div className="flex justify-between items-start">
                              <div className="flex-1">
                                  <p className="font-bold text-xl italic tracking-tight">{p.full_name}</p>
                                  <p className="text-xs opacity-40 font-medium mt-1">{p.email}</p>
                                  {p.phone && (
                                      <div className="flex items-center gap-2 mt-3">
                                          <span className="text-xs font-bold tabular-nums opacity-60">{p.phone}</span>
                                          <a href={getWhatsAppUrlForPhone(p.phone, '')} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold border border-green-100 active:scale-95 transition-all">
                                              <span>WhatsApp</span><span><WhatsAppIcon className="w-4 h-4 shrink-0" /></span>
                                          </a>
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${p.punch_card_remaining > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {p.punch_card_remaining} כרטיסיה
                                </div>
                                {p.punch_card_expiry && (
                                  <span className="text-[9px] opacity-40 tabular-nums">
                                    עד {new Date(p.punch_card_expiry).toLocaleDateString('he-IL', {day:'2-digit', month:'2-digit', year:'numeric'})}
                                  </span>
                                )}
                              </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-brand-stone/5 flex justify-between items-center">
                              <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{p.membership_type} בשבוע</span>
                              <div className="flex gap-6">
                                  <button onClick={() => { setEditingUserId(p.id); setUserFormData(profileToUserForm(p)); }} className="text-xs font-bold opacity-60 underline underline-offset-4">עריכה ✎</button>
                                  <button onClick={() => handleDeleteProfile(p.id)} className="text-xs font-bold text-red-400 underline underline-offset-4">מחיקה 🗑</button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Modals ─────────────────────────────────────────────────────── */}
        {/* Modal: class details + attendees + manual booking */}
        {detailsModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3.5rem] max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-10">
                    <div>
                      <h3 className="text-2xl font-bold italic tracking-tight">{detailsModal.name}</h3>
                      <p className="opacity-40 text-sm font-bold uppercase tracking-widest">{new Date(detailsModal.start_time).toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit' })}{' · '}{getSlotKeyFromStartTime(detailsModal.start_time) ?? ''}</p>
                    </div>
                    <button onClick={() => setDetailsModal(null)} className="text-2xl opacity-20 hover:opacity-100 transition-all">⨉</button>
                </div>
                <div className="mb-10">
                  <h4 className="text-[10px] font-black uppercase opacity-40 mb-5 tracking-widest">מתאמנות רשומות ({detailsModal.bookings?.length || 0})</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {detailsModal.bookings?.map((b: any) => {
                            const phone = b.profiles?.phone;
                            const name = b.profiles?.full_name;
                            const classDate = new Date(detailsModal.start_time).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });
                            const classTime = getSlotKeyFromStartTime(detailsModal.start_time) ?? '';
                            const waUrl = phone ? getWhatsAppUrlForPhone(phone, `היי ${name} 🌸\n\nתזכורת לאימון שלך:\n📅 ${classDate} בשעה ${classTime}\n🧘‍♀️ ${detailsModal.name}\n\nאם בסופו של דבר לא תוכלי להגיע — נשמח אם תבטלי את הרישום באתר כדי לפנות את המקום למתאמנת אחרת 🙏\n\nנתראה! 💪`) : null;
                            return (
                              <div key={b.id} className="bg-brand-bg p-4 rounded-2xl flex justify-between items-center text-sm shadow-sm transition-transform hover:scale-[1.01]">
                                  <span className="font-bold">{name}</span>
                                  <div className="flex items-center gap-3">
                                      {waUrl && (
                                          <a
                                              href={waUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              title="שליחת תזכורת בוואטסאפ"
                                              className="text-green-500 hover:text-green-700 font-bold text-[10px] transition-all uppercase"
                                          >
                                              תזכורת <WhatsAppIcon className="w-4 h-4 shrink-0" />
                                          </a>
                                      )}
                                      <button onClick={() => handleRemoveAttendee(b.id)} className="text-red-300 hover:text-red-500 font-bold text-[10px] transition-all uppercase">הסרה 🗑</button>
                                  </div>
                              </div>
                            );
                        })}
                        {!detailsModal.bookings?.length && <p className="text-center py-6 opacity-30 italic text-sm">אין עדיין רשומות לשיעור זה</p>}
                    </div>
                </div>
                <div className="bg-brand-stone/5 p-8 rounded-[2.5rem] border border-brand-stone/10">
                    <h4 className="text-[10px] font-black opacity-40 mb-5 uppercase tracking-widest">רישום ידני (עקיפת מכסה)</h4>
                    <div className="flex gap-2">
                        <select className="flex-1 p-4 bg-white rounded-2xl text-sm font-bold border outline-none shadow-sm" value={manualBookingUserId} onChange={e => setManualBookingUserId(e.target.value)}>
                            <option value="">בחרי מתאמנת...</option>{profiles.filter(p => p.role !== 'admin').filter(p => !detailsModal.bookings?.some((b: any) => b.profiles?.id === p.id)).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                        </select>
                        <button onClick={handleManualBooking} disabled={!manualBookingUserId} className="bg-brand-dark text-white px-8 rounded-2xl font-bold text-xs disabled:opacity-20 transition-all shadow-md active:scale-95">רישום</button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Modal: delete class (single vs future) */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
            <div className="bg-white p-12 rounded-[4rem] max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 italic text-center tracking-tight">ביטול שיעור 🧘‍♀️</h3>
              <p className="text-sm text-center mb-10 opacity-60 leading-relaxed font-medium">האם לבטל רק את השיעור הספציפי הזה, או שזהו שיעור קבוע שתרצי לבטל את כולו מהיום והלאה?</p>
              <div className="space-y-4">
                <button onClick={() => processDeletion('single')} className="w-full bg-brand-bg p-6 rounded-3xl font-bold hover:bg-brand-stone/10 transition-all text-sm tracking-tight">ביטול השיעור הזה בלבד</button>
                {deleteModal.classItem.recurring_id && <button onClick={() => processDeletion('future')} className="w-full bg-red-50 text-red-600 p-6 rounded-3xl font-bold hover:bg-red-100 transition-all text-sm tracking-tight">ביטול כל הסדרה מהיום והלאה</button>}
                <button onClick={() => setDeleteModal(null)} className="w-full p-2 text-[10px] font-black opacity-30 mt-10 uppercase underline tracking-[0.2em] transition-opacity hover:opacity-100">חזרה לניהול</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: welcome new trainee — send health form (email/WhatsApp) */}
        {welcomeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 backdrop-blur-md">
            <div className="bg-white p-12 rounded-[4rem] max-w-md w-full shadow-2xl">

              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🌸</div>
                <h3 className="text-2xl font-bold italic tracking-tight">
                  {welcomeModal.name} נוספה בהצלחה!
                </h3>
                <p className="text-sm opacity-50 mt-3 font-medium leading-relaxed">
                  לשלוח לה את טופס הצהרת הבריאות<br/>לפני האימון הראשון?
                </p>
              </div>

              <div className="space-y-4">

                {/* מייל */}
                <a
                  href={getMailtoUrl(welcomeModal.name, welcomeModal.email)}
                  className="w-full p-6 rounded-3xl font-bold bg-brand-bg hover:bg-brand-stone/10 transition-all text-sm tracking-tight flex items-center justify-center gap-3"
                >
                  ✉️ שליחה במייל
                </a>

                {/* וואטסאפ */}
                {welcomeModal.phone && (
                  <a
                    href={getWhatsAppUrl(welcomeModal.phone, welcomeModal.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-6 rounded-3xl font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-all text-sm tracking-tight flex items-center justify-center gap-3"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" /> שליחה בוואטסאפ
                  </a>
                )}

                <button
                  onClick={() => setWelcomeModal(null)}
                  className="w-full p-2 text-[10px] font-black opacity-30 uppercase underline tracking-[0.2em] transition-opacity hover:opacity-100"
                >
                  דילוג — אשלח מאוחר יותר
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: overlap detected while adding class */}
        {overlapModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3.5rem] max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-start gap-6 mb-8">
                <div>
                  <h3 className="text-2xl font-bold italic tracking-tight">יש חפיפה במערכת שעות</h3>
                  <p className="opacity-50 text-sm font-bold tracking-tight mt-2">
                    נמצאה חפיפה ביום {overlapModal.dayLabel}. אפשר לבחור מה לעשות.
                  </p>
                  {overlapModal.isRecurring && (
                    <p className="mt-2 text-[11px] opacity-50 leading-relaxed">
                      שימי לב: זהו שיעור קבוע (שנתי). יתכן שיש חפיפות רק בחלק מהתאריכים — הרשימה למטה מציגה את כל החפיפות שנמצאו מול המערכת הקיימת.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setOverlapModal(null)}
                  className="text-2xl opacity-20 hover:opacity-100 transition-all"
                  aria-label="סגירה"
                >
                  ⨉
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-brand-bg p-6 rounded-[2.5rem] border border-brand-stone/10">
                  <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">שיעורים חופפים</h4>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {overlapModal.conflicts.map((c: any) => (
                      <div key={`${c.id}-${c._conflictFor}`} className="bg-white p-4 rounded-2xl border border-brand-stone/10 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{c.name}</p>
                            <p className="text-[11px] opacity-50 font-bold tabular-nums mt-1">
                              {new Date(c.start_time).toLocaleString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] opacity-40 mt-1">
                              רשומות: {c.bookings?.length || 0}/{c.max_capacity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-brand-stone/5 p-6 rounded-[2.5rem] border border-brand-stone/10">
                    <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">אפשרויות</h4>

                    <div className="space-y-3">
                      <button
                        onClick={() => setOverlapModal(null)}
                        className="w-full bg-white p-5 rounded-2xl font-bold border border-brand-stone/10 hover:bg-brand-stone/10 transition-all text-sm"
                      >
                        לא להוסיף את השיעור החדש (ביטול)
                      </button>

                      <button
                        onClick={async () => {
                          const conflictIds = Array.from(new Set(overlapModal.conflicts.map((c: any) => c.id)));
                          if (!confirm(`לבטל ${conflictIds.length} שיעורים קיימים וליצור את השיעור החדש?`)) return;
                          const del = await deleteClassesByIds(conflictIds);
                          if (!del.ok) { alert(del.message); return; }

                          const supabase = await getAuthenticatedSupabase(getToken);
                          if (!supabase) return;
                          const { error } = await supabase.from('classes').insert(overlapModal.pendingInsert);
                          if (error) alert(error.message);
                          else alert("השיעור/ים נוספו בהצלחה (לאחר ביטול החופפים)!");
                          setOverlapModal(null);
                          loadData();
                        }}
                        className="w-full bg-red-50 text-red-700 p-5 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-all text-sm"
                      >
                        לבטל את השיעור/ים הקיימים החופפים ולהוסיף את החדש
                      </button>
                    </div>
                  </div>

                  <div className="bg-brand-bg p-6 rounded-[2.5rem] border border-brand-stone/10">
                    <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">שינוי שעה (מקומות פנויים באותו יום)</h4>
                    {overlapModal.suggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {overlapModal.suggestions.map(s => (
                          <button
                            key={`${s.hour}:${s.minute}`}
                            type="button"
                            onClick={() => {
                              setClassFormData({ ...classFormData, hour: s.hour, minute: s.minute });
                              setOverlapModal(null);
                            }}
                            className="px-4 py-2 rounded-full bg-white border border-brand-stone/10 text-xs font-bold hover:bg-brand-stone/10 transition-all tabular-nums"
                            title="עדכון השעה בטופס"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm opacity-40 italic">לא נמצאו חלונות פנויים של שעה ביום הזה (לפי ההגדרות הנוכחיות).</p>
                    )}
                    <p className="text-[11px] opacity-40 mt-4 leading-relaxed">
                      בחירה באחד הזמנים תעדכן את השעה בטופס. לאחר מכן אפשר ללחוץ שוב על "הוספה".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
