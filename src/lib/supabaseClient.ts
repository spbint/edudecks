import { createClient } from "@supabase/supabase-js";

const bundledPublicSupabaseUrl = "https://jgllsqixpfypunnstinl.supabase.co";
const bundledPublicSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbGxzcWl4cGZ5cHVubnN0aW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTc0MDYsImV4cCI6MjA4MjQ5MzQwNn0.YYKiRuxYye7_iDfQ4nZ6U4pFiTVtt1lIGSSwQa98CBE";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || bundledPublicSupabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || bundledPublicSupabaseAnonKey
);
