import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://erxipmyusdybncndtquc.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyeGlwbXl1c2R5Ym5jbmR0cXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMTMxODMsImV4cCI6MjA4NDg4OTE4M30.laHr-v4_stSlqIvdfweDXIZKSdxeTIXghrKOsSx-ANY"

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
