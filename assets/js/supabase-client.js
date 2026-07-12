// Supabase browser client setup.
// Fill in your own Project URL and anon public key during Phase 5 setup.
// Never paste a service_role key into this file.
(function () {
  const SUPABASE_URL = "https://ptliwaethkzwzlfqxxbp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_TxRHPhBk6jyydjJ_QyLHqQ_pHI-ORl9";

  const hasConfig =
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_URL.includes(".supabase.co") &&
    SUPABASE_ANON_KEY.length > 40 &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

  const state = {
    isConfigured: hasConfig,
    client: null
  };

  if (!window.supabase) {
    console.warn("Supabase CDN is not loaded yet. Demo data will keep working.");
    window.PromptGallerySupabase = state;
    return;
  }

  if (!hasConfig) {
    console.info("Supabase is not configured yet. Add your Project URL and anon key in assets/js/supabase-client.js.");
    window.PromptGallerySupabase = state;
    return;
  }

  state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.PromptGallerySupabase = state;
})();
