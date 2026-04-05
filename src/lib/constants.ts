import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SERVICE_PHONE = "052-6409993";
export const STUDIO_NAME = "העונג שבפילאטיס";
export const ADMIN_EMAILS = ['hilaglazz13@gmail.com', 'oneg3gri@gmail.com'].map(email => email.toLowerCase());
export const SERVICE_EMAIL = "oneg3gri@gmail.com";
export const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') ?? [];
export const STUDIO_ADDRESS = "רחוב איינשטיין 3, כפר סבא";
export const GOOGLE_MAPS_URL = `https://www.google.com/maps?q=${encodeURIComponent(STUDIO_ADDRESS)}`;
export const GOOGLE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(STUDIO_ADDRESS)}&output=embed&hl=iw&z=16`;
export const WAZE_NAVIGATION_URL = `https://waze.com/ul?q=${encodeURIComponent(STUDIO_ADDRESS)}&navigate=yes`;

// ─── Schedule / calendar layout (shared by admin + user portal) ─────────────
export const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\''] as const;
export const TIME_SLOTS = [ '06:45', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00','15:00', '16:00', '17:30', '18:30', '19:30', '20:30'
] as const;
export const HOUR_HEIGHT = 100;
export const MORNING_START = 6;
export const LATEST_CLASS_START_HOUR = 21;
export type HolidayMap = Record<string, string[]>;
const ISRAEL_TIMEZONE = "Asia/Jerusalem";

// ─── Booking rules (user portal) ──────────────────────────────────────────
export const CANCELLATION_WINDOW_HOURS = 24;

/** כרטיסיות במחירון — מספר אימונים בחבילה (מסונכרן עם טופס מתאמנת במנהל). */
export const PUNCH_CARD_PACKAGE_SIZES = [1, 5, 10, 20] as const;

/** ברירת מחדל לניקובים כשהמתאמנת על כרטיסייה בלבד (membership_type === 0). */
export const DEFAULT_PUNCH_FOR_PUNCH_CARD_ONLY = 10;

/** תוקף כרטיסייה לפי מספר ניקובים (נדרש במסך מנהל). */
export const PUNCH_CARD_VALIDITY_RULES: Record<number, { weeks?: number; months?: number }> = {
  1: { weeks: 1 },
  5: { months: 2 },
  10: { months: 2 },
  20: { months: 3 },
};

// ─── Admin: class types & external links ──────────────────────────────────
export const CLASS_TEMPLATES = [
  "מכשירים", "שיקומי- אישי"
] as const;
export const HEALTH_FORM_URL = process.env.NEXT_PUBLIC_HEALTH_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLSfyhdYaC3Sw4afJU-IXjoEbhgNr62w3yeW5seL31i9md8YPrg/viewform?pli=1';

// ─── Shared functions ─────────────────────────────────────────────────────
/** Get Supabase client with Clerk JWT. Pass getToken from useAuth(). */
export async function getAuthenticatedSupabase(
  getToken: (opts: { template: string }) => Promise<string | null>
): Promise<SupabaseClient | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  try {
    const token = await getToken({ template: 'supabase' });
    if (!token) return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  } catch {
    return null;
  }
}
/** Normalize Israeli phone for WhatsApp link (strip non-digits, 0 → 972). */
export const normalizePhoneForWhatsApp = (phone: string): string =>
  phone.replace(/\D/g, '').replace(/^0/, '972');

/** WhatsApp URL for a given phone and optional pre-filled message. */
export const getWhatsAppUrlForPhone = (phone: string, message: string): string =>
  `https://wa.me/${normalizePhoneForWhatsApp(phone)}${message ? `?text=${encodeURI(message)}` : ''}`;

/** Studio contact WhatsApp link (uses SERVICE_PHONE). */
export const getWhatsAppLink = (message: string): string =>
  getWhatsAppUrlForPhone(SERVICE_PHONE, message);

/** Format date string for Hebrew locale (DD.MM.YYYY). */
export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Format time for Hebrew locale (HH:MM). */
export const formatTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

/** Whether two dates fall in the same week (Sun–Sat). */
export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff1 = d1.getDate() - d1.getDay();
  const diff2 = d2.getDate() - d2.getDay();
  const week1 = new Date(d1.setDate(diff1)).toDateString();
  const week2 = new Date(d2.setDate(diff2)).toDateString();
  return week1 === week2;
};

/** Build YYYY-MM-DD date key in local time. */
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Convert a Date to a local datetime string (YYYY-MM-DDTHH:MM:SS) with NO timezone offset.
 * Use this when saving start_time to Supabase — avoids UTC shift (e.g. 09:00 saved as 07:00Z).
 */
export const toLocalDateTimeString = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

/**
 * Extract HH:MM from a start_time string using local time.
 * Used to match against TIME_SLOTS and position cards on the schedule grid.
 */
export const getSlotKeyFromStartTime = (startTime: string): string | null => {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Build YYYY-MM-DD date key in Israel timezone. */
export const toIsraelDateKey = (d: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
};

/** Fetch Jewish holidays by Gregorian year from Hebcal API. */
export const fetchJewishHolidays = async (years: number[]): Promise<HolidayMap> => {
  const map: HolidayMap = {};
  await Promise.all(
    years.map(async (year) => {
      const res = await fetch(
        `https://www.hebcal.com/hebcal?v=1&cfg=json&i=on&maj=on&min=on&mod=on&nx=on&year=${year}&month=x&geo=none&M=on&s=on&lg=he&tzid=${encodeURIComponent(ISRAEL_TIMEZONE)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      for (const item of data.items ?? []) {
        if (!item?.date) continue;
        const holidayName = item.hebrew || item.title;
        if (!holidayName) continue;
        const dateKey = toIsraelDateKey(new Date(item.date));
        map[dateKey] = [...(map[dateKey] ?? []), holidayName];
      }
    })
  );
  return map;
};