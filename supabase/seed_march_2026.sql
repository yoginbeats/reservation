-- ============================================================
-- Superlines: Create tables (if missing) + Seed March 2026
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (safe to re-run)
create extension if not exists "uuid-ossp";

-- BUSES table
create table if not exists public.buses (
    id uuid default uuid_generate_v4() primary key,
    bus_number text not null unique,
    capacity int not null default 45,
    bus_type text not null,
    created_at timestamptz default now()
);

-- TRIPS table
create table if not exists public.trips (
    id uuid default uuid_generate_v4() primary key,
    bus_id uuid references public.buses(id) on delete set null,
    origin text not null,
    destination text not null,
    departure_time timestamptz not null,
    price decimal(10, 2) not null,
    created_at timestamptz default now()
);

-- RLS (safe to re-run)
alter table public.buses enable row level security;
alter table public.trips enable row level security;

-- Drop old policies if they exist so re-runs don't error
drop policy if exists "Anyone can view trips" on public.trips;
drop policy if exists "Admins can do everything" on public.trips;
drop policy if exists "Anyone can view buses" on public.buses;

create policy "Anyone can view trips" on public.trips for select using (true);
create policy "Admins can do everything" on public.trips for all using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);
create policy "Anyone can view buses" on public.buses for select using (true);

-- ============================================================
-- Upsert Buses
-- ============================================================
insert into public.buses (bus_number, bus_type, capacity) values
    ('SL-AC-101',  'Regular Aircon', 49),
    ('SL-FC-201',  'First Class',    45),
    ('SL-ORD-301', 'Ordinary',       49)
on conflict (bus_number) do update
    set bus_type = excluded.bus_type,
        capacity = excluded.capacity;

-- ============================================================
-- Seed Daet → Cubao trips for every day in March 2026
-- Air-Conditioned : 07:30, 09:00, 14:00, 18:30, 19:45
-- First Class     : 19:00, 20:30, 21:00
-- Ordinary        : 12:00, 16:45, 19:00, 20:00
--
-- Seed Daet → PITX trips for every day in March 2026
-- Air-Conditioned : 06:00 (early/general), 14:00, 18:30, 21:30
-- First Class     : 19:00, 20:30, 21:00
-- Ordinary        : 12:00, 16:45, 19:00, 20:00
-- All times are Philippine Time (UTC+8)
-- ============================================================
do $$
declare
    v_ac_id  uuid;
    v_fc_id  uuid;
    v_ord_id uuid;
    v_day    int;
    v_date   date;
begin
    select id into v_ac_id  from public.buses where bus_number = 'SL-AC-101';
    select id into v_fc_id  from public.buses where bus_number = 'SL-FC-201';
    select id into v_ord_id from public.buses where bus_number = 'SL-ORD-301';

    for v_day in 1..31 loop
        v_date := make_date(2026, 3, v_day);

        -- ── DAET → CUBAO ─────────────────────────────────────────

        -- Regular Aircon
        insert into public.trips (bus_id, origin, destination, departure_time, price) values
            (v_ac_id, 'DAET', 'CUBAO', (v_date || ' 07:30:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'CUBAO', (v_date || ' 09:00:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'CUBAO', (v_date || ' 14:00:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'CUBAO', (v_date || ' 18:30:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'CUBAO', (v_date || ' 19:45:00+08')::timestamptz, 650.00);

        -- First Class
        insert into public.trips (bus_id, origin, destination, departure_time, price) values
            (v_fc_id, 'DAET', 'CUBAO', (v_date || ' 19:00:00+08')::timestamptz, 950.00),
            (v_fc_id, 'DAET', 'CUBAO', (v_date || ' 20:30:00+08')::timestamptz, 950.00),
            (v_fc_id, 'DAET', 'CUBAO', (v_date || ' 21:00:00+08')::timestamptz, 950.00);

        -- Ordinary
        insert into public.trips (bus_id, origin, destination, departure_time, price) values
            (v_ord_id, 'DAET', 'CUBAO', (v_date || ' 12:00:00+08')::timestamptz, 450.00),
            (v_ord_id, 'DAET', 'CUBAO', (v_date || ' 16:45:00+08')::timestamptz, 450.00),
            (v_ord_id, 'DAET', 'CUBAO', (v_date || ' 19:00:00+08')::timestamptz, 450.00),
            (v_ord_id, 'DAET', 'CUBAO', (v_date || ' 20:00:00+08')::timestamptz, 450.00);

        -- ── DAET → PITX ──────────────────────────────────────────

        -- Regular Aircon (incl. 06:00 early/general trip)
        insert into public.trips (bus_id, origin, destination, departure_time, price) values
            (v_ac_id, 'DAET', 'PITX', (v_date || ' 06:00:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'PITX', (v_date || ' 14:00:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'PITX', (v_date || ' 18:30:00+08')::timestamptz, 650.00),
            (v_ac_id, 'DAET', 'PITX', (v_date || ' 21:30:00+08')::timestamptz, 650.00);

        -- First Class
        insert into public.trips (bus_id, origin, destination, departure_time, price) values
            (v_fc_id, 'DAET', 'PITX', (v_date || ' 19:00:00+08')::timestamptz, 950.00),
            (v_fc_id, 'DAET', 'PITX', (v_date || ' 20:30:00+08')::timestamptz, 950.00),
            (v_fc_id, 'DAET', 'PITX', (v_date || ' 21:00:00+08')::timestamptz, 950.00);

        -- Ordinary
        insert into public.trips (bus_id, origin, destination, departure_time, price) values
            (v_ord_id, 'DAET', 'PITX', (v_date || ' 12:00:00+08')::timestamptz, 450.00),
            (v_ord_id, 'DAET', 'PITX', (v_date || ' 16:45:00+08')::timestamptz, 450.00),
            (v_ord_id, 'DAET', 'PITX', (v_date || ' 19:00:00+08')::timestamptz, 450.00),
            (v_ord_id, 'DAET', 'PITX', (v_date || ' 20:00:00+08')::timestamptz, 450.00);

    end loop;
end;
$$;

select
    destination,
    count(*) as trips_seeded
from public.trips
where origin = 'DAET'
  and departure_time >= '2026-03-01'
  and departure_time < '2026-04-01'
group by destination
order by destination;
