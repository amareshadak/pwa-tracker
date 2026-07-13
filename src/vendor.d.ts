declare const Chart: any;
declare const lucide: { createIcons(): void };

interface Window {
  APP_CONFIG?: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    VAPID_PUBLIC_KEY?: string;
    TIMEZONE?: string;
  };
}
