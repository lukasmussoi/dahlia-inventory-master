// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ciasrofbyqxthkycdeie.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXNyb2ZieXF4dGhreWNkZWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDYzMDEsImV4cCI6MjA2NzIyMjMwMX0.BjklcOWixNl_s_l8YWY0JhNgeNj_kuKa7RIdCMAuoHE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});