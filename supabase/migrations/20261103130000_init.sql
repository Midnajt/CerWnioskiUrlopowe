-- Schemat MVP: pracownicy, limity, wnioski urlopowe, historia i powiadomienia.

create extension if not exists pgcrypto;

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  first_name text not null,
  last_name text not null,
  employee_number text not null unique,
  department_id uuid not null references departments (id),
  location_id uuid not null references locations (id),
  job_title text not null,
  manager_id uuid references employees (id),
  fte numeric(3, 2) not null default 1.00 check (fte > 0 and fte <= 1),
  is_director boolean not null default false,
  is_hr boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index employees_manager_idx on employees (manager_id);

create table leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id),
  year int not null check (year between 2000 and 2100),
  pool text not null check (pool in ('current', 'overdue')),
  entitled_days int not null check (entitled_days >= 0),
  used_days int not null default 0 check (used_days >= 0),
  unique (employee_id, year, pool)
);

create table public_holidays (
  holiday_date date primary key,
  name text not null
);

create table approver_substitutions (
  id uuid primary key default gen_random_uuid(),
  approver_employee_id uuid not null references employees (id),
  substitute_employee_id uuid not null references employees (id),
  date_from date not null,
  date_to date not null,
  check (date_to >= date_from),
  check (approver_employee_id <> substitute_employee_id)
);

create sequence leave_request_seq;

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  employee_id uuid not null references employees (id),
  leave_type text not null check (leave_type in ('current', 'overdue')),
  status text not null check (status in (
    'roboczy',
    'oczekuje_przelozonego',
    'oczekuje_dyrektora',
    'oczekuje_kadr',
    'zaakceptowany',
    'odrzucony',
    'cofniety_pracownik',
    'wycofany'
  )),
  date_from date not null,
  date_to date not null,
  working_days int not null check (working_days >= 0),
  calendar_days int not null check (calendar_days > 0),
  requires_director boolean not null,
  substitute_employee_id uuid references employees (id),
  manager_assignee_id uuid references employees (id),
  director_assignee_id uuid references employees (id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_to >= date_from),
  check (substitute_employee_id is null or substitute_employee_id <> employee_id)
);

create index leave_requests_employee_idx on leave_requests (employee_id);
create index leave_requests_status_idx on leave_requests (status);
create index leave_requests_manager_idx on leave_requests (manager_assignee_id);
create index leave_requests_director_idx on leave_requests (director_assignee_id);

create table leave_allocations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references leave_requests (id) on delete cascade,
  year int not null check (year between 2000 and 2100),
  days int not null check (days > 0),
  unique (request_id, year)
);

create table leave_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references leave_requests (id) on delete cascade,
  actor_id uuid references employees (id),
  action text not null,
  comment text,
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);

create index leave_events_request_idx on leave_events (request_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_employee_id uuid not null references employees (id),
  request_id uuid references leave_requests (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on notifications (recipient_employee_id, read_at);

-- Rok z Warszawy, numer z sekwencji. Woła tylko service role.
create function next_leave_number()
returns text
language sql
volatile
as $$
  select 'WU-' || to_char(timezone('Europe/Warsaw', now()), 'YYYY')
    || '-' || lpad(nextval('leave_request_seq')::text, 4, '0');
$$;

revoke all on function next_leave_number() from public;
grant execute on function next_leave_number() to service_role;

alter table departments enable row level security;
alter table locations enable row level security;
alter table employees enable row level security;
alter table leave_balances enable row level security;
alter table public_holidays enable row level security;
alter table approver_substitutions enable row level security;
alter table leave_requests enable row level security;
alter table leave_allocations enable row level security;
alter table leave_events enable row level security;
alter table notifications enable row level security;
