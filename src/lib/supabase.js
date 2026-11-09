import { createClient } from "@supabase/supabase-js";
const MODE_KEY = "royal-barber-data-mode";
const storedMode = typeof window !== "undefined" ? window.localStorage.getItem(MODE_KEY) : null;
export const activeMode = storedMode === "demo" ? "demo" : "live";
const liveUrl = import.meta.env.VITE_LIVE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const liveAnonKey = import.meta.env.VITE_LIVE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const demoUrl = import.meta.env.VITE_DEMO_SUPABASE_URL;
const demoAnonKey = import.meta.env.VITE_DEMO_SUPABASE_ANON_KEY;
const selectedUrl = activeMode === "demo" ? demoUrl : liveUrl;
const selectedAnonKey = activeMode === "demo" ? demoAnonKey : liveAnonKey;
export const isSupabaseConfigured = Boolean(selectedUrl && selectedAnonKey);
export const isDemoEnvironmentConfigured = Boolean(demoUrl && demoAnonKey);
export const supabase = isSupabaseConfigured ? createClient(selectedUrl, selectedAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
    storageKey: activeMode === "demo" ? "royal-barber-demo-auth" : "royal-barber-live-auth" }
}) : null;
export function switchSupabaseMode(nextMode) {
  if (!["demo", "live"].includes(nextMode)) throw new Error("Unknown data environment.");
  if (nextMode === "demo" && !isDemoEnvironmentConfigured) throw new Error("Demo Supabase is not configured yet. Ask the system administrator to set the demo project URL and anon key.");
  if (nextMode === activeMode) return;
  window.localStorage.setItem(MODE_KEY, nextMode);
  window.location.reload();
}
