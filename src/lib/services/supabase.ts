import { createClient } from "@supabase/supabase-js";

console.log('Initializing Supabase client...');
console.log('URL:', import.meta.env.VITE_PUBLIC_SUPABASE_URL);
console.log('Key present:', !!import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client created successfully');