-- Step 1: Enable the pgjwt extension (if available on your Supabase instance)
-- Supabase natively supports pgjwt, but it often needs to be explicitly enabled.
create extension if not exists pgjwt schema extensions;

-- Step 2: Create a function to generate a JWT token for a specific user.
-- This allows the Python backend (acting as a service role) to securely generate 
-- a token for a user so that subsequent database calls respect RLS.
create or replace function public.generate_user_jwt(user_id uuid)
returns text
language plpgsql
security definer -- Runs with the privileges of the creator (usually the postgres/service role)
as $$
declare
  jwt_secret text;
  token text;
  payload json;
begin
  -- Retrieve the JWT secret from the current database settings
  -- Supabase stores this in the app.settings.jwt_secret configuration
  jwt_secret := current_setting('app.settings.jwt_secret', true);
  
  if jwt_secret is null then
    raise exception 'JWT secret is not configured in this database.';
  end if;

  -- Construct the payload imitating an authenticated Supabase user
  payload := json_build_object(
    'role', 'authenticated',
    'iss', 'supabase',
    'sub', user_id,
    'aud', 'authenticated',
    'exp', extract(epoch from now() + interval '1 hour')::integer
  );

  -- Use pgjwt to sign the token
  select extensions.sign(payload, jwt_secret) into token;
  
  return token;
end;
$$;

-- Step 3: Grant execute permission ONLY to the service_role
-- We absolutely do NOT want anonymous or authenticated users generating their own tokens.
revoke execute on function public.generate_user_jwt(uuid) from public;
revoke execute on function public.generate_user_jwt(uuid) from authenticated;
revoke execute on function public.generate_user_jwt(uuid) from anon;
grant execute on function public.generate_user_jwt(uuid) to service_role;
