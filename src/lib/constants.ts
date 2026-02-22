export const SERVICE_PHONE = "052-6409993";
export const STUDIO_NAME = "עונג של פילאטיס";
export const ADMIN_EMAILS = ['hilaglazz13@gmail.com', 'oneg3gri@gmail.com'].map(email => email.toLowerCase());
export const SERVICE_EMAIL = "oneg3gri@gmail.com";

// ─── Schedule / calendar layout (shared by admin + user portal) ─────────────
export const DAYS_HEBREW = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''] as const;
export const TIME_SLOTS = [ '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  'break',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
] as const;
export const HOUR_HEIGHT = 100;
export const MORNING_START = 7;
export const MORNING_END = 13;
export const EVENING_START = 16;
export const EVENING_END = 22;

// ─── Booking rules (user portal) ──────────────────────────────────────────
export const CANCELLATION_WINDOW_HOURS = 4;

// ─── Admin: class types & external links ──────────────────────────────────
export const CLASS_TEMPLATES = [
  "מכשירים - Level 1", "מכשירים - Level 2", "מכשירים - Level 3",
  "מזרן - Level 1", "מזרן - Level 2", "מזרן - Level 3"
] as const;
export const HEALTH_FORM_URL = process.env.NEXT_PUBLIC_HEALTH_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLSfyhdYaC3Sw4afJU-IXjoEbhgNr62w3yeW5seL31i9md8YPrg/viewform?pli=1';

// ─── Helpers ──────────────────────────────────────────────────────────────
export const getWhatsAppLink = (message: string) => {
  const cleanPhone = SERVICE_PHONE.replace(/\D/g, '').replace(/^0/, '972');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};