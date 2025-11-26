"use client";

import { createContext, useContext, useState } from "react";
import { getBrowserClient } from "../lib/supabase-browser";

const SupabaseContext = createContext<any>(null);

export default function SupabaseProvider({ children }: any) {
  const [client] = useState(() => getBrowserClient());

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
