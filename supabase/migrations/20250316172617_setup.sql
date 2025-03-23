-- extensions we use in
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE; -- https://github.com/supabase/vault
CREATE EXTENSION IF NOT EXISTS pgmq; -- https://tembo.io/pgmq/#creating-a-queue

-- elwood_studio schema
CREATE SCHEMA IF NOT EXISTS elwood_studio;
grant usage on schema elwood_studio to postgres, anon, authenticated, service_role;
alter default privileges in schema elwood_studio grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema elwood_studio grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema elwood_studio grant all on sequences to postgres, anon, authenticated;


-- create elwood_studio queue
SELECT pgmq.create('elwood_studio');

