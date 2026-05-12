-- Run this script in your Supabase SQL Editor to create the announcements table

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active announcements
CREATE POLICY "Allow public read access to active announcements"
    ON public.announcements
    FOR SELECT
    USING (is_active = true);

-- Note: Admin operations will bypass RLS by using the service_role key (supabaseAdmin).
