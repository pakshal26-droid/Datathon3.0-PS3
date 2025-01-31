import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgvhoxfeppkanwpkiany.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndmhveGZlcHBrYW53cGtpYW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDgxMjEsImV4cCI6MjA1Mzg4NDEyMX0.8caNA4GZ9SHaDuynSQ8AWF_7PEWV2JXM4z8MG4L32QM'

export const supabase = createClient(supabaseUrl, supabaseKey)
