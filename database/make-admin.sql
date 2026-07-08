-- AI Prompt Gallery - Make your account an admin
-- 1. Create your user in Supabase Authentication first.
-- 2. Replace the email below with your admin email.
-- 3. Run this in Supabase Dashboard > SQL Editor.

insert into public.profiles (id, username, display_name, role)
select
  auth.users.id,
  case
    when char_length(lower(regexp_replace(split_part(auth.users.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))) >= 3
      then left(lower(regexp_replace(split_part(auth.users.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')), 17) || '_' || substr(replace(auth.users.id::text, '-', ''), 1, 12)
    else 'user_' || substr(replace(auth.users.id::text, '-', ''), 1, 12)
  end,
  case
    when char_length(split_part(auth.users.email, '@', 1)) >= 2
      then left(split_part(auth.users.email, '@', 1), 80)
    else 'Admin user'
  end,
  'admin'
from auth.users
where auth.users.email = 'your-admin-email@example.com'
on conflict (id) do update
set role = 'admin';
