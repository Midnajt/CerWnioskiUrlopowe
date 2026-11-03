# Schemat bazy — Cer

Postgres w Supabase, region EU. Opis jest źródłem kolumn dla `lib/db/` i `supabase/migrations/`.
Klucz secret omija RLS. Polityk dla klucza anon nie ma: przeglądarka nie czyta tych tabel.

Pula `current` to urlop bieżący danego roku. Pula `overdue` to urlop zaległy z roku `year`.
Cały dzień schodzi z puli jako jeden dzień roboczy. Niepełny dzień schodzi z puli bieżącej i z limitu na żądanie ułamkiem `planned_hours / 8`. Urlop zaległy jest tylko w pełnych dniach. Odbiór za sobotę nie schodzi z puli. Wymiar etatu jest zapisany i nie przelicza limitu.

## departments

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK, `gen_random_uuid()` |
| name | text | unikalna nazwa działu |

## locations

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| name | text | unikalna lokalizacja |

## employees

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| auth_user_id | uuid | unikalne, null przed powiązaniem z Auth |
| first_name | text | |
| last_name | text | |
| employee_number | text | unikalny numer kadrowy |
| department_id | uuid | FK → departments |
| location_id | uuid | FK → locations |
| job_title | text | stanowisko |
| manager_id | uuid | FK → employees, null na szczycie struktury |
| fte | numeric(3,2) | wymiar etatu, informacyjnie |
| is_director | boolean | flaga dyrektora |
| is_hr | boolean | flaga kadr |
| active | boolean | nieaktywny nie może być zastępcą |
| created_at | timestamptz | |

Przełożony zespołu to pracownik, którego `id` stoi w `manager_id` innych osób.

## leave_balances

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| employee_id | uuid | FK → employees |
| year | int | rok puli |
| pool | text | `current` albo `overdue` |
| entitled_days | int | wymiar |
| used_days | int | zużycie zapisane w seedzie, poza wnioskami aplikacji |

Unikalność: `(employee_id, year, pool)`.

## public_holidays

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| holiday_date | date | PK |
| name | text | nazwa święta |

Sobót i niedziel tu nie ma. Dni robocze liczy aplikacja.

## approver_substitutions

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| approver_employee_id | uuid | FK → employees, osoba zastępowana |
| substitute_employee_id | uuid | FK → employees, inna osoba |
| date_from | date | |
| date_to | date | `date_to >= date_from` |

Nowe wnioski w tym terminie dostają zastępcę jako adresata etapu. Jeden przeskok, bez łańcucha.

## leave_requests

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| request_number | text | unikalny, z funkcji `next_leave_number()` |
| employee_id | uuid | FK → employees, wnioskujący |
| leave_type | text | `current`, `overdue`, `on_demand`, `saturday_comp` |
| status | text | statusy poniżej |
| date_from | date | dla `saturday_comp` proponowany dzień wolny |
| date_to | date | nie wcześniej niż `date_from` |
| working_days | int | dni robocze |
| calendar_days | int | dni kalendarzowe łącznie z końcami |
| requires_director | boolean | `calendar_days > 21` |
| worked_date | date | dzień przepracowany, tylko `saturday_comp`, poza terminem odbioru |
| full_day | boolean | `false` oznacza jeden dzień roboczy w godzinach |
| time_from | text | `HH:MM`, tylko gdy `full_day = false` |
| time_to | text | `HH:MM`, później niż `time_from`, krok 15 minut |
| planned_hours | numeric(5,2) | cały dzień: `working_days * 8`; niepełny: różnica godzin, do 8 |
| substitute_employee_id | uuid | FK → employees, null w roboczym |
| manager_assignee_id | uuid | adresat etapu przełożonego |
| director_assignee_id | uuid | adresat etapu dyrektora |
| submitted_at | timestamptz | null, dopóki roboczy |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Statusy: `roboczy`, `oczekuje_przelozonego`, `oczekuje_dyrektora`, `oczekuje_kadr`, `zaakceptowany`, `odrzucony`, `cofniety_pracownik`, `wycofany`.

Wniosek w statusie oczekującym albo `zaakceptowany` zajmuje limit i blokuje zastępstwo. `zaakceptowany` z `date_to` wcześniejszym niż dziś liczy się jako wykorzystany, pozostałe jako zaplanowane.

`on_demand` zajmuje pulę `current` roku rozpoczęcia i osobny podlimit 4 dni w tym roku. `saturday_comp` nie zajmuje puli wypoczynkowej. Przy niepełnym dniu do puli wchodzi `planned_hours / 8` zamiast całego `working_days`.

## leave_allocations

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| request_id | uuid | FK → leave_requests, kasowany z wnioskiem |
| year | int | rok zaległego |
| days | int | dni zdjęte z tego roku |

Tylko dla `leave_type = overdue`. Najstarszy rok pierwszy. Unikalność: `(request_id, year)`.

## leave_events

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| request_id | uuid | FK → leave_requests |
| actor_id | uuid | FK → employees, null gdy brak |
| action | text | np. `zlozono`, `zaakceptowano` |
| comment | text | wymagany przy odrzuceniu i cofnięciu |
| from_status | text | null przy utworzeniu |
| to_status | text | |
| created_at | timestamptz | |

Interfejs nie kasuje historii.

## notifications

| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | uuid | PK |
| recipient_employee_id | uuid | FK → employees |
| request_id | uuid | FK → leave_requests |
| body | text | treść w aplikacji |
| read_at | timestamptz | null = nieprzeczytane |
| created_at | timestamptz | |

## next_leave_number()

Zwraca tekst `WU-RRRR-0001`. Rok z zegara `Europe/Warsaw`, numer z sekwencji `leave_request_seq`.
Wykonanie tylko dla `service_role`.
