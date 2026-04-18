-- ============================================================
-- YHEPL ERP — Bucket Flow Patch
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Finished goods register — output from completed buckets
create table if not exists finished_goods (
  id              uuid primary key default uuid_generate_v4(),
  record_code     text unique not null,      -- FG-2024-0001
  bucket_id       uuid not null references buckets(id),
  project_id      uuid references projects(id),
  product_type_id uuid references product_types(id),
  accepted_qty    numeric(12,4) not null default 0,
  rejected_qty    numeric(12,4) not null default 0,
  total_qty       numeric(12,4) not null,
  destination     text not null default 'next_process', -- 'next_process','inventory','dispatch','scrap'
  next_bucket_id  uuid references buckets(id),          -- if destination = next_process
  location_id     uuid references stock_locations(id),
  notes           text,
  recorded_at     timestamptz not null default now(),
  recorded_by     uuid references user_profiles(id)
);
create index if not exists idx_fg_bucket on finished_goods(bucket_id);
create index if not exists idx_fg_project on finished_goods(project_id);

-- RLS for finished_goods
alter table finished_goods enable row level security;
create policy "auth read finished_goods" on finished_goods for select to authenticated using (true);
create policy "auth write finished_goods" on finished_goods for all to authenticated using (true) with check (true);

-- 2. Bucket time logs — consolidated machine+labour log per bucket operation
-- (already have machine_logs and labour_bucket_logs — just need policy fixes)

-- Fix RLS on buckets (allow authenticated users to read/write)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='buckets' and policyname='auth read buckets') then
    execute 'create policy "auth read buckets" on buckets for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='buckets' and policyname='auth write buckets') then
    execute 'create policy "auth write buckets" on buckets for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='bucket_history' and policyname='auth read bucket_history') then
    execute 'create policy "auth read bucket_history" on bucket_history for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='bucket_history' and policyname='auth write bucket_history') then
    execute 'create policy "auth write bucket_history" on bucket_history for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='machine_logs' and policyname='auth read machine_logs') then
    execute 'create policy "auth read machine_logs" on machine_logs for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='machine_logs' and policyname='auth write machine_logs') then
    execute 'create policy "auth write machine_logs" on machine_logs for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='labour_bucket_logs' and policyname='auth read labour_bucket_logs') then
    execute 'create policy "auth read labour_bucket_logs" on labour_bucket_logs for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='labour_bucket_logs' and policyname='auth write labour_bucket_logs') then
    execute 'create policy "auth write labour_bucket_logs" on labour_bucket_logs for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='qc_logs' and policyname='auth read qc_logs') then
    execute 'create policy "auth read qc_logs" on qc_logs for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='qc_logs' and policyname='auth write qc_logs') then
    execute 'create policy "auth write qc_logs" on qc_logs for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='ncr' and policyname='auth read ncr') then
    execute 'create policy "auth read ncr" on ncr for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='ncr' and policyname='auth write ncr') then
    execute 'create policy "auth write ncr" on ncr for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='capa' and policyname='auth read capa') then
    execute 'create policy "auth read capa" on capa for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='capa' and policyname='auth write capa') then
    execute 'create policy "auth write capa" on capa for all to authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='auth read projects') then
    execute 'create policy "auth read projects" on projects for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='auth write projects') then
    execute 'create policy "auth write projects" on projects for all to authenticated using (true) with check (true)';
  end if;
end $$;

-- ============================================================
-- DONE — Run this in Supabase SQL Editor
-- ============================================================
