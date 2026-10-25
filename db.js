// Shared Supabase client. `db` is null when no keys are set, so the customer page falls back to sample data.
const db = (window.CONFIG && CONFIG.SUPABASE_URL && window.supabase)
  ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : null;
