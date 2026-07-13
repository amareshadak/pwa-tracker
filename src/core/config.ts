export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  vapidPublicKey: string;
  timezone: string;
}

export const config: AppConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://mfjoetsdqkdlvplejyds.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Im1mam9ldHNkcWtkbHZwbGVqeWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODQyMTksImV4cCI6MjA5OTM2MDIxOX0.Oygt5vpWd7d7wgYTg4b8yy3_ba4EZS8Srb0vZKe6qHw',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BC3hn1L8e06eEM8_CAt57NFNKOZ96_b1nXkqDBS4e3Babwb9aNm44cGa5sHp5yb8o3nOz6EBdkaIKCUKUpV-r8s',
  timezone: import.meta.env.VITE_TIMEZONE || 'Asia/Kolkata'
};
