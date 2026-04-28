import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wbskcybuhanfpcbumcxa.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indic2tjeWJ1aGFuZnBjYnVtY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTYwNzYsImV4cCI6MjA4NjkzMjA3Nn0.-fPPY9_6tbBx8Bm2VIv9qEvqZ7KFpsOOmyrJU9GK_ys"
    )
