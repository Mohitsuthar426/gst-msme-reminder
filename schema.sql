-- GST/MSME Compliance Reminder Tool - Supabase schema
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  gst_number text not null unique,
  phone text not null,
  filing_frequency text not null check (filing_frequency in ('monthly', 'quarterly')),
  created_at timestamptz not null default now()
);

create table if not exists public.filing_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  filed_date date not null,
  period text not null,
  status text not null default 'filed' check (status in ('filed')),
  created_at timestamptz not null default now()
);

create index if not exists filing_records_business_date_idx
  on public.filing_records (business_id, filed_date desc);

alter table public.businesses enable row level security;
alter table public.filing_records enable row level security;

create policy "business owner can read business"
  on public.businesses for select
  using (auth.uid() = user_id);

create policy "business owner can insert business"
  on public.businesses for insert
  with check (auth.uid() = user_id);

create policy "business owner can update business"
  on public.businesses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "business owner can delete business"
  on public.businesses for delete
  using (auth.uid() = user_id);

create policy "business owner can read filings"
  on public.filing_records for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = filing_records.business_id
      and b.user_id = auth.uid()
    )
  );

create policy "business owner can insert filings"
  on public.filing_records for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = filing_records.business_id
      and b.user_id = auth.uid()
    )
  );

create policy "business owner can update filings"
  on public.filing_records for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = filing_records.business_id
      and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = filing_records.business_id
      and b.user_id = auth.uid()
    )
  );

create policy "business owner can delete filings"
  on public.filing_records for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = filing_records.business_id
      and b.user_id = auth.uid()
    )
  );

-- Create the business automatically at signup from Supabase Auth metadata.
-- This avoids a race when email confirmation is enabled.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.businesses (
    user_id, name, gst_number, phone, filing_frequency
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'My Business'),
    upper(trim(coalesce(new.raw_user_meta_data->>'gst_number', ''))),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_user_meta_data->>'filing_frequency' in ('monthly', 'quarterly')
        then new.raw_user_meta_data->>'filing_frequency'
      else 'monthly'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Optional hardening: GSTIN shape check (15 chars, standard alphanumeric form).
alter table public.businesses
  drop constraint if exists gst_number_format;

alter table public.businesses
  add constraint gst_number_format
  check (gst_number ~ '^[0-9A-Z]{15}$');
