-- Etap 1: urlop na żądanie, odbiór za sobotę oraz niepełny dzień w godzinach.
-- Istniejące wnioski zostają całodniowe, a godziny wyliczają się z dni roboczych.

alter table leave_requests drop constraint if exists leave_requests_leave_type_check;

alter table leave_requests
  add constraint leave_requests_leave_type_check
  check (leave_type in ('current', 'overdue', 'on_demand', 'saturday_comp'));

alter table leave_requests
  add column worked_date date,
  add column full_day boolean not null default true,
  add column time_from text,
  add column time_to text,
  add column planned_hours numeric(5, 2) not null default 0;

update leave_requests
set planned_hours = working_days * 8
where full_day = true;

alter table leave_requests
  add constraint leave_requests_planned_hours_check check (planned_hours >= 0);

alter table leave_requests
  add constraint leave_requests_day_span_check check (
    (
      full_day = true
      and time_from is null
      and time_to is null
    )
    or (
      full_day = false
      and time_from ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and time_to ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and time_to > time_from
      and planned_hours > 0
      and planned_hours <= 8
    )
  );

alter table leave_requests
  add constraint leave_requests_worked_date_check check (
    (leave_type = 'saturday_comp' and worked_date is not null and (worked_date < date_from or worked_date > date_to))
    or (leave_type <> 'saturday_comp' and worked_date is null)
  );
