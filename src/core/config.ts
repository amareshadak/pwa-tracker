export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  vapidPublicKey: string;
  timezone: string;
}

export const config: AppConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://mfjoetsdqkdlvplejyds.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BC3hn1L8e06eEM8_CAt57NFNKOZ96_b1nXkqDBS4e3Babwb9aNm44cGa5sHp5yb8o3nOz6EBdkaIKCUKUpV-r8s',
  timezone: import.meta.env.VITE_TIMEZONE || 'Asia/Kolkata'
};
