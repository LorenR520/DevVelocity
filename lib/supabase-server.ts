// lib/supabase-server.ts
import { supabase } from "@/lib/supabase-browser";

export function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}
