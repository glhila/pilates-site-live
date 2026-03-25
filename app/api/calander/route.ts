// app/api/calendar/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role – קריאה ישירה ללא auth
  );

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, start_time, max_capacity, bookings!class_id(profiles(full_name))')
    .gte('start_time', new Date().toISOString())
    .order('start_time');

  const events = (classes ?? []).map((c) => {
    const [datePart, timePart] = c.start_time.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = (timePart ?? '00:00').split(':');

    const totalMinutes = parseInt(hour, 10) * 60 + parseInt(minute, 10) + 50;
    const endHour   = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const endMinute = String(totalMinutes % 60).padStart(2, '0');

    const dtStart = `${year}${month}${day}T${hour}${minute}00`;
    const dtEnd   = `${year}${month}${day}T${endHour}${endMinute}00`;

    const attendees = (c.bookings ?? [])
      .map((b: any) => b.profiles?.full_name)
      .filter(Boolean)
      .join(', ') || 'אין רשומות';

    return [
      'BEGIN:VEVENT',
      `UID:${c.id}@oneg-pilates`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:פילאטיס ${c.name}`,
      'LOCATION:רחוב איינשטיין 3 כפר סבא',
      `DESCRIPTION:רשומות: ${attendees}`,
      'SEQUENCE:1',
      'END:VEVENT',
    ].join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Oneg Pilates//HE',
    'NAME:עונג של פילאטיס',
    'X-WR-CALNAME:עונג של פילאטיס',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
    },
  });
}