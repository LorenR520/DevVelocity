-- TEAM ACCOUNTS
create table teams (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete set null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- TEAM MEMBERS (SEATS)
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  joined_at timestamp with time zone default now()
);

-- BILLING METADATA
create table team_billing (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  plan text not null,           -- developer / startup / team / enterprise
  included_seats int not null,  -- default: 3 / 5 / 10 / custom
  extra_seat_price numeric not null,
  provider text not null,       -- stripe or lemon
  subscription_id text,         -- provider subscription ID
  created_at timestamp with time zone default now()
);
