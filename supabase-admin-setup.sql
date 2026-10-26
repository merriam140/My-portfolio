-- GizmoGlow: private administrator + contact-message storage
-- Run this script in Supabase Dashboard > SQL Editor.
-- IMPORTANT: replace YOUR_REGISTERED_EMAIL@example.com below with the exact email
-- address of the account you already registered. Do not put a password or secret key here.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

-- A security-definer helper lets policies check admin status without exposing the
-- admin list or allowing users to grant themselves administrator access.
create or replace function public.is_gizmoglow_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_gizmoglow_admin() from public;
grant execute on function public.is_gizmoglow_admin() to authenticated;

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null default '',
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;

drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
on public.contact_messages
for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 120
  and char_length(trim(email)) between 3 and 254
  and char_length(trim(message)) between 1 and 5000
);

drop policy if exists "Only administrators can read contact messages" on public.contact_messages;
create policy "Only administrators can read contact messages"
on public.contact_messages
for select
to authenticated
using ((select public.is_gizmoglow_admin()));

drop policy if exists "Only administrators can delete contact messages" on public.contact_messages;
create policy "Only administrators can delete contact messages"
on public.contact_messages
for delete
to authenticated
using ((select public.is_gizmoglow_admin()));

-- Grant administrator status to the account you already registered.
-- If this inserts 0 rows, first register/confirm that email in Supabase Authentication.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('YOUR_REGISTERED_EMAIL@example.com')
on conflict (user_id) do nothing;

-- Check the result. You should see your user ID and created_at row.
select au.user_id, u.email, au.created_at
from public.admin_users au
join auth.users u on u.id = au.user_id;
