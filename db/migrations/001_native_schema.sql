begin;

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'USER',
  first_name text,
  last_name text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('USER', 'INSURER', 'ADMIN'))
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.insurers (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  logo_url text,
  contact_email text,
  phone text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurer_accounts (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  insurer_id bigint not null references public.insurers(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint insurer_accounts_profile_insurer_key unique (profile_id, insurer_id)
);

create table if not exists public.insurance_categories (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coverage_categories (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coverages (
  id bigint generated always as identity primary key,
  code text not null unique,
  type text not null,
  name text not null,
  description text,
  calculation_type text not null default 'FIXED_AMOUNT',
  category_id bigint references public.coverage_categories(id),
  insurer_id bigint not null references public.insurers(id),
  is_mandatory boolean not null default false,
  is_optional boolean not null default false,
  conditions text not null default '{}',
  is_active boolean not null default true,
  display_order integer not null default 0,
  variable_source text,
  rate_percent double precision,
  conditioned_by_new_value boolean not null default false,
  new_value_threshold double precision,
  rate_below_threshold double precision,
  rate_above_threshold double precision,
  fixed_amount double precision,
  pack_price_reduced double precision,
  capital double precision,
  min_amount double precision,
  max_amount double precision,
  matrix_dimension text,
  requires_guarantee text,
  metadata text not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coverages_calculation_type_check check (calculation_type in ('FREE', 'FIXED_AMOUNT', 'VARIABLE_BASED', 'MATRIX_BASED'))
);

create table if not exists public.coverage_tariff_rules (
  id bigint generated always as identity primary key,
  coverage_id bigint not null references public.coverages(id) on delete cascade,
  vehicle_category text,
  min_fiscal_power integer,
  max_fiscal_power integer,
  min_vehicle_value double precision,
  max_vehicle_value double precision,
  fuel_type text,
  formula_name text,
  base_rate double precision,
  fixed_amount double precision,
  min_amount double precision,
  max_amount double precision,
  conditions text not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_offers (
  id bigint generated always as identity primary key,
  insurer_id bigint not null references public.insurers(id),
  category_id bigint references public.insurance_categories(id),
  name text not null,
  description text,
  price_min integer,
  price_max integer,
  coverage_amount integer,
  deductible integer not null default 0,
  features text not null default '[]',
  contract_type text,
  is_active boolean not null default true,
  fiscal_power_min integer,
  fiscal_power_max integer,
  fuel_types text not null default '[]',
  new_value_min integer,
  new_value_max integer,
  venal_value_min integer,
  venal_value_max integer,
  vehicle_usage text not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_packages (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  base_price integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.package_coverages (
  id bigint generated always as identity primary key,
  package_id bigint not null references public.insurance_packages(id) on delete cascade,
  coverage_id bigint not null references public.coverages(id) on delete cascade,
  is_mandatory boolean not null default true,
  created_at timestamptz not null default now(),
  constraint package_coverages_package_coverage_key unique (package_id, coverage_id)
);

create table if not exists public.quotes (
  id bigint generated always as identity primary key,
  reference text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  category_id bigint references public.insurance_categories(id),
  offer_id bigint references public.insurance_offers(id),
  status text not null default 'DRAFT',
  estimated_price integer,
  final_price double precision,
  notes text,
  vehicle_data text not null default '{}',
  personal_data text not null default '{}',
  coverage_requirements text not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_status_check check (status in ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED')),
  constraint quotes_estimated_price_pos check (estimated_price is null or estimated_price >= 0),
  constraint quotes_final_price_pos check (final_price is null or final_price >= 0)
);

create table if not exists public.quote_coverages (
  id bigint generated always as identity primary key,
  quote_id bigint not null references public.quotes(id) on delete cascade,
  coverage_id bigint not null references public.coverages(id),
  tariff_rule_id bigint references public.coverage_tariff_rules(id),
  premium_amount integer not null,
  calculation_parameters text not null default '{}',
  is_included boolean not null default true,
  is_mandatory boolean not null default false,
  created_at timestamptz not null default now(),
  constraint quote_coverages_quote_coverage_key unique (quote_id, coverage_id),
  constraint quote_coverages_premium_pos check (premium_amount >= 0)
);

create table if not exists public.contracts (
  id bigint generated always as identity primary key,
  reference text not null unique,
  quote_id bigint unique references public.quotes(id) on delete set null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  insurer_id bigint not null references public.insurers(id) on delete cascade,
  offer_id bigint references public.insurance_offers(id) on delete set null,
  status text not null default 'ACTIVE',
  start_date date not null default current_date,
  end_date date,
  premium double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_status_check check (status in ('ACTIVE', 'EXPIRED', 'CANCELLED'))
);

create table if not exists public.claims (
  id bigint generated always as identity primary key,
  reference text not null unique,
  contract_id bigint not null references public.contracts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  insurer_id bigint not null references public.insurers(id) on delete cascade,
  type text not null,
  description text not null,
  incident_date date,
  status text not null default 'SUBMITTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_status_check check (status in ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'))
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  insurer_id bigint not null references public.insurers(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_unique_per_insurer unique (profile_id, insurer_id)
);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'INFO',
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CALLBACK'))
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  user_name text,
  action text not null,
  entity text not null,
  entity_id text,
  details text not null default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id bigint generated always as identity primary key,
  key text not null unique,
  value text not null default '',
  category text not null default 'general',
  label text not null,
  type text not null default 'text',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backups (
  id bigint generated always as identity primary key,
  filename text not null,
  file_size integer not null default 0,
  status text not null default 'COMPLETED',
  type text not null default 'MANUAL',
  schedule text,
  next_run timestamptz,
  path text,
  note text,
  created_at timestamptz not null default now(),
  constraint backups_status_check check (status in ('COMPLETED', 'FAILED', 'IN_PROGRESS', 'SCHEDULED')),
  constraint backups_type_check check (type in ('MANUAL', 'SCHEDULED', 'AUTO'))
);

create table if not exists public.roles (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id bigint generated always as identity primary key,
  role_id bigint not null references public.roles(id) on delete cascade,
  permission_id bigint not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint role_permissions_role_permission_key unique (role_id, permission_id)
);

create table if not exists public.profile_roles (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_roles_profile_role_key unique (profile_id, role_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'profiles', 'insurers', 'insurance_categories',
    'coverage_categories', 'coverages', 'coverage_tariff_rules',
    'insurance_offers', 'insurance_packages', 'quotes', 'contracts',
    'claims', 'reviews', 'system_settings', 'roles'
  ] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);
create index if not exists insurer_accounts_insurer_id_idx on public.insurer_accounts(insurer_id);
create index if not exists coverages_insurer_id_idx on public.coverages(insurer_id);
create index if not exists coverage_tariff_rules_coverage_id_idx on public.coverage_tariff_rules(coverage_id);
create index if not exists insurance_offers_insurer_id_idx on public.insurance_offers(insurer_id);
create index if not exists quotes_user_id_idx on public.quotes(user_id);
create index if not exists quotes_offer_id_idx on public.quotes(offer_id);
create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists contracts_profile_id_idx on public.contracts(profile_id);
create index if not exists claims_profile_id_idx on public.claims(profile_id);
create index if not exists notifications_user_id_is_read_idx on public.notifications(user_id, is_read);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

commit;
