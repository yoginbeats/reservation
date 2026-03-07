import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tvyibzqxruhywdlsugbo.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2eWlienF4cnVoeXdkbHN1Z2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzExNDUsImV4cCI6MjA4NjEwNzE0NX0.kdEua46esGGCuCUj3T-nQs5r1y4-nU5flk0jPFQZK-w"
    )
