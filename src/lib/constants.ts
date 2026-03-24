import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SERVICE_PHONE = "052-6409993";
export const STUDIO_NAME = "העונג שבפילאטיס";
export const ADMIN_EMAILS = ['hilaglazz13@gmail.com', 'oneg3gri@gmail.com'].map(email => email.toLowerCase());
export const SERVICE_EMAIL = "oneg3gri@gmail.com";
export const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') ?? [];
export const STUDIO_ADDRESS = "רחוב איינשטיין 3, כפר סבא";
export const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=%D7%A8%D7%97%D7%95%D7%91%20%D7%90%D7%99%D7%99%D7%A0%D7%A9%D7%98%D7%99%D7%99%D7%9F%203%2C%20%D7%9B%D7%A4%D7%A8%20%D7%A1%D7%91%D7%90";
export const WAZE_NAVIGATION_URL = "https://waze.com/ul?q=%D7%A8%D7%97%D7%95%D7%91%20%D7%90%D7%99%D7%99%D7%A0%D7%A9%D7%98%D7%99%D7%99%D7%9F%203%2C%20%D7%9B%D7%A4%D7%A8%20%D7%A1%D7%91%D7%90&navigate=yes";

// ─── Schedule / calendar layout (shared by admin + user portal) ─────────────
export const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\''] as const;
export const TIME_SLOTS = [ '06:45', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00','15:00', '16:00', '17:30', '18:30', '19:30', '20:30'
] as const;
export const HOUR_HEIGHT = 100;
export const MORNING_START = 6;
export const MORNING_END = 20;
export type HolidayMap = Record<string, string[]>;

// ─── Booking rules (user portal) ──────────────────────────────────────────
export const CANCELLATION_WINDOW_HOURS = 24;

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
  `https://wa.me/${normalizePhoneForWhatsApp(phone)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

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

/** Fetch Jewish holidays by Gregorian year from Hebcal API. */
export const fetchJewishHolidays = async (years: number[]): Promise<HolidayMap> => {
  const map: HolidayMap = {};
  await Promise.all(
    years.map(async (year) => {
      const res = await fetch(
        `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${year}&month=x&geo=none&M=on&s=on`
      );
      if (!res.ok) return;
      const data = await res.json();
      for (const item of data.items ?? []) {
        if (!item?.date || !item?.title) continue;
        const dateKey = String(item.date).split("T")[0];
        map[dateKey] = [...(map[dateKey] ?? []), item.title];
      }
    })
  );
  return map;
};