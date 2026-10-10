-- DFW Coptic Calendar schema. All access goes through the server with the service-role key,
-- so RLS is enabled with no policies (anon/public clients can read nothing).

create table churches (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  address       text not null,
  city          text not null,
  lat           double precision not null,
  lng           double precision not null,
  website       text,
  sources       jsonb not null default '[]',
  liturgy_times text
);

create table events (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  title       text not null,
  description text,
  start       timestamptz not null,
  "end"       timestamptz,
  all_day     boolean not null default false,
  location    text,
  categories  text[] not null default '{}',
  source_url  text,
  origin      text not null check (origin in ('agent', 'ics', 'submission')),
  dedupe_key  text not null unique,
  updated_at  timestamptz not null default now()
);
create index events_start_idx on events (start);

create table subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  categories  text[] not null default '{}',
  church_ids  uuid[] not null default '{}',
  confirmed   boolean not null default false,
  token       text not null unique,
  created_at  timestamptz not null default now()
);

create table submissions (
  id              uuid primary key default gen_random_uuid(),
  church_id       uuid not null references churches(id) on delete cascade,
  title           text not null,
  description     text,
  start           timestamptz not null,
  "end"           timestamptz,
  location        text,
  categories      text[] not null default '{}',
  flyer_url       text,
  submitter_email text not null,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now()
);

alter table churches    enable row level security;
alter table events      enable row level security;
alter table subscribers enable row level security;
alter table submissions enable row level security;
