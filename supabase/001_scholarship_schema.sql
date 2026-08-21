-- Scholarship domain schema for Supabase/PostgreSQL.
-- The migration is additive and keeps the columns used by the current UI.

create extension if not exists pgcrypto;

do $$ begin
  create type public.education_level as enum ('licence', 'master', 'doctorat');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.scholarship_step_status as enum ('not_started', 'started', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.profile_document_type as enum ('last_diploma', 'recommendation_letter');
exception when duplicate_object then null;
end $$;

-- User profile. The id is the Supabase Auth user id.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists age smallint,
  add column if not exists gender text,
  add column if not exists education text;

alter table public.profiles
  drop constraint if exists profiles_age_check;

alter table public.profiles
  add constraint profiles_age_check check (age is null or age between 13 and 120);

create table if not exists public.profile_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type public.profile_document_type not null,
  file_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_documents_profile_id_idx
  on public.profile_documents(profile_id);

-- Main scholarship record. Existing legacy columns remain available to the UI.
alter table public.scholarships
  add column if not exists education_level public.education_level,
  add column if not exists opening_date date,
  add column if not exists destination_country text,
  add column if not exists host_organization text;

create table if not exists public.scholarship_domains (
  id uuid primary key default gen_random_uuid(),
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (scholarship_id, name)
);

create index if not exists scholarship_domains_scholarship_id_idx
  on public.scholarship_domains(scholarship_id);

create table if not exists public.scholarship_links (
  id uuid primary key default gen_random_uuid(),
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  name text not null,
  url text not null,
  created_at timestamptz not null default now(),
  constraint scholarship_links_url_check check (url ~* '^https?://')
);

create index if not exists scholarship_links_scholarship_id_idx
  on public.scholarship_links(scholarship_id);

create table if not exists public.scholarship_admission_criteria (
  scholarship_id uuid primary key references public.scholarships(id) on delete cascade,
  english_required boolean not null default false,
  minimum_average numeric(5, 2),
  recommendation_letters_required smallint not null default 0,
  constraint scholarship_criteria_average_check
    check (minimum_average is null or minimum_average between 0 and 20),
  constraint scholarship_criteria_letters_check
    check (recommendation_letters_required >= 0)
);

create table if not exists public.scholarship_steps (
  id uuid primary key default gen_random_uuid(),
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  position smallint not null,
  status public.scholarship_step_status not null default 'not_started',
  description text,
  completion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scholarship_id, position),
  constraint scholarship_steps_position_check check (position > 0),
  constraint scholarship_steps_completed_reason_check
    check (status <> 'completed' or completion_reason is not null)
);

create index if not exists scholarship_steps_scholarship_id_idx
  on public.scholarship_steps(scholarship_id);

-- Keep updated_at current for records edited from the application.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_documents_updated_at on public.profile_documents;
create trigger set_profile_documents_updated_at
before update on public.profile_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_scholarship_steps_updated_at on public.scholarship_steps;
create trigger set_scholarship_steps_updated_at
before update on public.scholarship_steps
for each row execute function public.set_updated_at();

-- Row Level Security: users can only access their own profile and scholarships.
alter table public.profiles enable row level security;
alter table public.profile_documents enable row level security;
alter table public.scholarships enable row level security;
alter table public.scholarship_domains enable row level security;
alter table public.scholarship_links enable row level security;
alter table public.scholarship_admission_criteria enable row level security;
alter table public.scholarship_steps enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users manage their own documents" on public.profile_documents;
create policy "Users manage their own documents"
  on public.profile_documents for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "Users manage their own scholarships" on public.scholarships;
create policy "Users manage their own scholarships"
  on public.scholarships for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage scholarship domains" on public.scholarship_domains;
create policy "Users manage scholarship domains"
  on public.scholarship_domains for all to authenticated
  using (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()));

drop policy if exists "Users manage scholarship links" on public.scholarship_links;
create policy "Users manage scholarship links"
  on public.scholarship_links for all to authenticated
  using (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()));

drop policy if exists "Users manage scholarship criteria" on public.scholarship_admission_criteria;
create policy "Users manage scholarship criteria"
  on public.scholarship_admission_criteria for all to authenticated
  using (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()));

drop policy if exists "Users manage scholarship steps" on public.scholarship_steps;
create policy "Users manage scholarship steps"
  on public.scholarship_steps for all to authenticated
  using (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.scholarships s where s.id = scholarship_id and s.user_id = auth.uid()));

-- Development-only access for the current client, which uses anon_key and a fixed user id.
-- Anyone possessing the public anon key can access data belonging to this UUID.
-- Replace these policies with authenticated policies before using real user data.
alter table public.reminders enable row level security;

drop policy if exists "Anon manages the default profile" on public.profiles;
create policy "Anon manages the default profile"
  on public.profiles for all to anon
  using (id = '00000000-0000-0000-0000-000000000000'::uuid)
  with check (id = '00000000-0000-0000-0000-000000000000'::uuid);

drop policy if exists "Anon manages default profile documents" on public.profile_documents;
create policy "Anon manages default profile documents"
  on public.profile_documents for all to anon
  using (profile_id = '00000000-0000-0000-0000-000000000000'::uuid)
  with check (profile_id = '00000000-0000-0000-0000-000000000000'::uuid);

drop policy if exists "Anon manages default scholarships" on public.scholarships;
create policy "Anon manages default scholarships"
  on public.scholarships for all to anon
  using (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

drop policy if exists "Anon manages default scholarship domains" on public.scholarship_domains;
create policy "Anon manages default scholarship domains"
  on public.scholarship_domains for all to anon
  using (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ))
  with check (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ));

drop policy if exists "Anon manages default scholarship links" on public.scholarship_links;
create policy "Anon manages default scholarship links"
  on public.scholarship_links for all to anon
  using (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ))
  with check (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ));

drop policy if exists "Anon manages default scholarship criteria" on public.scholarship_admission_criteria;
create policy "Anon manages default scholarship criteria"
  on public.scholarship_admission_criteria for all to anon
  using (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ))
  with check (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ));

drop policy if exists "Anon manages default scholarship steps" on public.scholarship_steps;
create policy "Anon manages default scholarship steps"
  on public.scholarship_steps for all to anon
  using (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ))
  with check (exists (
    select 1 from public.scholarships s
    where s.id = scholarship_id
      and s.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ));

drop policy if exists "Anon manages default reminders" on public.reminders;
create policy "Anon manages default reminders"
  on public.reminders for all to anon
  using (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000000'::uuid);
