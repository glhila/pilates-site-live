import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // 1. קבלת ההדרים לאימות
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 })
  }

  // 2. קבלת גוף ההודעה
  //const payload = await req.json()
  const body = await req.json();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  // 3. אימות החתימה
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 })
  }

  // 4. טיפול באירוע יצירת משתמש
  const eventType = evt.type;
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0].email_address;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    // התחברות ל-Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // הכנסה לטבלת profiles
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: id,
        email: email,
        full_name: fullName,
        is_approved: false // ברירת מחדל - מחכה לאישור המנהלת
      })

    if (error) {
      console.error('Error inserting user to Supabase:', error)
      return new Response('Error updating database', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}