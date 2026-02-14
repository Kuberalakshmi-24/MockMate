import { createClient } from '@supabase/supabase-js';

// Unga Supabase Keys (App.jsx or Backend la irundhu eduthukonga)
const SUPABASE_URL = "https://aavrrwinijuztpuskrwk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdnJyd2luaWp1enRwdXNrcndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODUyMTQsImV4cCI6MjA4NjI2MTIxNH0.4N81fJrs6SyR-a2D0Nl1_cPZJwcoLdXOp6kIrLbh1VI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);