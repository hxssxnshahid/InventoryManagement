import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vslwxxfeusclldpcogwq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzbHd4eGZldXNjbGxkcGNvZ3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Mzk4OTksImV4cCI6MjA1OTMxNTg5OX0.9_Lyt43gP4-iVOUPX9PTc26PJ02TZ7azOdCS0elkEmo'
export const supabase = createClient(supabaseUrl, supabaseKey) 