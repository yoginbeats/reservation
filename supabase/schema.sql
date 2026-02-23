-- Superlines Transportation Reservation System Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    full_name text,
    email text,
    phone text,
    created_at timestamptz default now()
);

-- USER ROLES
create table if not exists public.user_roles (
    user_id uuid references auth.users on delete cascade not null primary key,
    role text not null check (role in ('admin', 'client')),
    created_at timestamptz default now()
);

-- BUSES
create table if not exists public.buses (
    id uuid default uuid_generate_v4() primary key,
    bus_number text not null unique,
    capacity int not null default 45,
    bus_type text not null, -- 'Aircon', 'Ordinary', 'Deluxe'
    created_at timestamptz default now()
);

-- TRIPS
create table if not exists public.trips (
    id uuid default uuid_generate_v4() primary key,
    bus_id uuid references public.buses(id) on delete set null,
    origin text not null,
    destination text not null,
    departure_time timestamptz not null,
    price decimal(10, 2) not null,
    created_at timestamptz default now()
);

-- SEATS (Maybe pre-populate or dynamic per trip?)
-- For simplicity, let's track reservations per seat on a trip.
create table if not exists public.reservations (
    id uuid default uuid_generate_v4() primary key,
    customer_id uuid references auth.users(id) on delete cascade not null,
    trip_id uuid references public.trips(id) on delete cascade not null,
    seat_number text not null,
    total_price decimal(10, 2) not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
    created_at timestamptz default now()
);

-- TICKETS
create table if not exists public.tickets (
    id uuid default uuid_generate_v4() primary key,
    reservation_id uuid references public.reservations(id) on delete cascade not null,
    qr_code text, -- placeholder for QR content
    issued_at timestamptz default now(),
    created_at timestamptz default now()
);

-- PAYMENTS
create table if not exists public.payments (
    id uuid default uuid_generate_v4() primary key,
    reservation_id uuid references public.reservations(id) on delete cascade not null,
    amount decimal(10, 2) not null,
    status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
    payment_method text, -- 'GCash', 'PayMaya', etc.
    transaction_id text unique,
    created_at timestamptz default now()
);

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.buses enable row level security;
alter table public.trips enable row level security;
alter table public.reservations enable row level security;
alter table public.tickets enable row level security;
alter table public.payments enable row level security;

-- Policies for profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Policies for user_roles
create policy "Users can view their own role" on public.user_roles for select using (auth.uid() = user_id);

-- Policies for trips
create policy "Anyone can view trips" on public.trips for select using (true);

-- Policies for reservations
create policy "Users can view their own reservations" on public.reservations for select using (auth.uid() = customer_id);
create policy "Users can insert their own reservations" on public.reservations for insert with check (auth.uid() = customer_id);

-- Admin access (Simplified check for now)
create policy "Admins can do everything" on public.trips for all using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);
-- (Add similar admin policies for other tables as needed)
