// lib/supabase-browser.ts
"use client";

import { supabase } from "@/lib/supabase-browser";

export function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}
