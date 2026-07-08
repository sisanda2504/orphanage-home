// supabase-config.js
export const supabaseUrl = 'https://irzqdsxdiifosqzqdypj.supabase.co'
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyenFkc3hkaWlmb3NxenFkeXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MTgwMjYsImV4cCI6MjA5ODk5NDAyNn0.2mzC2WjiVIN2imGfKh0aKhdP97PCT6eLsTxOS4lfbh0'

// Import from CDN with the correct URL
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)