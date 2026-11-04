import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  calendarDaysInclusive,
  countWorkingDays,
  requiresDirector,
  shiftIsoDate,
  todayInWarsaw,
} from "../lib/leave/dates";
import { polishHolidays } from "./pl-holidays";

function loadEnv(): void {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

type Pool = "current" | "overdue";

type Person = {
  email: string;
  number: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  location: string;
  director: boolean;
  hr: boolean;
  managerNumber: string | null;
  balances: { year: number; pool: Pool; entitled: number; used: number }[];
};

function must<T>(value: T | null, message: string): T {
  if (value === null || value === undefined) throw new Error(message);
  return value;
}

async function ensureUser(supabase: SupabaseClient, email: string, password: string): Promise<string> {
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw new Error(listed.error.message);
  const existing = listed.data.users.find((user) => user.email === email);
  if (existing) return existing.id;
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error(created.error?.message ?? email);
  return created.data.user.id;
}

async function idByName(
  supabase: SupabaseClient,
  table: "departments" | "locations",
  name: string,
): Promise<string> {
  const saved = await supabase.from(table).upsert({ name }, { onConflict: "name" }).select("id").single();
  if (saved.error || !saved.data) throw new Error(saved.error?.message ?? name);
  return saved.data.id as string;
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.SEED_PASSWORD ?? "";
  if (!url || !secret || password.length < 8) {
    console.error("Uzupełnij SUPABASE_URL, SUPABASE_SECRET_KEY i SEED_PASSWORD (min. 8 znaków) w .env.");
    process.exit(1);
  }

  const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const today = todayInWarsaw();
  const year = Number(today.slice(0, 4));
  const people: Person[] = [
    {
      email: "ewa.nowak@cer.example",
      number: "E001",
      firstName: "Ewa",
      lastName: "Nowak",
      title: "Dyrektor",
      department: "Zarząd",
      location: "Biuro",
      director: true,
      hr: false,
      managerNumber: null,
      balances: [{ year, pool: "current", entitled: 26, used: 2 }],
    },
    {
      email: "marek.kadry@cer.example",
      number: "E002",
      firstName: "Marek",
      lastName: "Kadry",
      title: "Specjalista ds. kadr",
      department: "Kadry",
      location: "Biuro",
      director: false,
      hr: true,
      managerNumber: "E001",
      balances: [
        { year, pool: "current", entitled: 26, used: 3 },
        { year: year - 1, pool: "overdue", entitled: 4, used: 0 },
      ],
    },
    {
      email: "robert.wisniewski@cer.example",
      number: "E003",
      firstName: "Robert",
      lastName: "Wiśniewski",
      title: "Kierownik",
      department: "Produkcja",
      location: "Zakład",
      director: false,
      hr: false,
      managerNumber: "E001",
      balances: [
        { year, pool: "current", entitled: 26, used: 8 },
        { year: year - 1, pool: "overdue", entitled: 2, used: 0 },
      ],
    },
    {
      email: "anna.kowalska@cer.example",
      number: "E004",
      firstName: "Anna",
      lastName: "Kowalska",
      title: "Specjalista",
      department: "Produkcja",
      location: "Zakład",
      director: false,
      hr: false,
      managerNumber: "E003",
      balances: [
        { year, pool: "current", entitled: 26, used: 12 },
        { year: year - 1, pool: "overdue", entitled: 6, used: 0 },
        { year: year - 2, pool: "overdue", entitled: 1, used: 0 },
      ],
    },
    {
      email: "piotr.zielinski@cer.example",
      number: "E005",
      firstName: "Piotr",
      lastName: "Zieliński",
      title: "Specjalista",
      department: "Produkcja",
      location: "Zakład",
      director: false,
      hr: false,
      managerNumber: "E003",
      balances: [{ year, pool: "current", entitled: 20, used: 18 }],
    },
    {
      email: "barbara.lewandowska@cer.example",
      number: "E006",
      firstName: "Barbara",
      lastName: "Lewandowska",
      title: "Specjalista",
      department: "Produkcja",
      location: "Zakład",
      director: false,
      hr: false,
      managerNumber: "E003",
      balances: [{ year, pool: "current", entitled: 26, used: 4 }],
    },
    {
      email: "m.olszewski@cermotor.com.pl",
      number: "E007",
      firstName: "Michał",
      lastName: "Olszewski",
      title: "Kierownik",
      department: "IT",
      location: "Biuro",
      director: false,
      hr: false,
      managerNumber: "E001",
      balances: [{ year, pool: "current", entitled: 26, used: 0 }],
    },
    {
      email: "m.krzysztoszek@cermotor.com.pl",
      number: "E008",
      firstName: "Marcin",
      lastName: "Krzysztoszek",
      title: "Specjalista",
      department: "IT",
      location: "Biuro",
      director: false,
      hr: false,
      managerNumber: "E007",
      balances: [{ year, pool: "current", entitled: 26, used: 0 }],
    },
  ];

  const departmentIds = new Map<string, string>();
  const locationIds = new Map<string, string>();
  for (const name of [...new Set(people.map((person) => person.department))]) {
    departmentIds.set(name, await idByName(supabase, "departments", name));
  }
  for (const name of [...new Set(people.map((person) => person.location))]) {
    locationIds.set(name, await idByName(supabase, "locations", name));
  }

  const employeeIds = new Map<string, string>();
  for (const person of people) {
    const authUserId = await ensureUser(supabase, person.email, password);
    const saved = await supabase
      .from("employees")
      .upsert(
        {
          auth_user_id: authUserId,
          first_name: person.firstName,
          last_name: person.lastName,
          employee_number: person.number,
          department_id: must(departmentIds.get(person.department) ?? null, person.department),
          location_id: must(locationIds.get(person.location) ?? null, person.location),
          job_title: person.title,
          fte: 1,
          is_director: person.director,
          is_hr: person.hr,
          active: true,
        },
        { onConflict: "employee_number" },
      )
      .select("id")
      .single();
    if (saved.error || !saved.data) throw new Error(saved.error?.message ?? person.email);
    employeeIds.set(person.number, saved.data.id as string);
  }

  for (const person of people) {
    const managerId = person.managerNumber ? (employeeIds.get(person.managerNumber) ?? null) : null;
    const updated = await supabase
      .from("employees")
      .update({ manager_id: managerId })
      .eq("id", must(employeeIds.get(person.number) ?? null, person.number));
    if (updated.error) throw new Error(updated.error.message);
    for (const balance of person.balances) {
      const row = await supabase.from("leave_balances").upsert(
        {
          employee_id: employeeIds.get(person.number),
          year: balance.year,
          pool: balance.pool,
          entitled_days: balance.entitled,
          used_days: balance.used,
        },
        { onConflict: "employee_id,year,pool" },
      );
      if (row.error) throw new Error(row.error.message);
    }
  }

  for (const holidayYear of [year, year + 1, year + 2]) {
    const rows = polishHolidays(holidayYear).map((holiday) => ({
      holiday_date: holiday.date,
      name: holiday.name,
    }));
    const saved = await supabase.from("public_holidays").upsert(rows, { onConflict: "holiday_date" });
    if (saved.error) throw new Error(saved.error.message);
  }

  const robertId = must(employeeIds.get("E003") ?? null, "Robert");
  const barbaraId = must(employeeIds.get("E006") ?? null, "Barbara");
  const annaId = must(employeeIds.get("E004") ?? null, "Anna");
  const marekId = must(employeeIds.get("E002") ?? null, "Marek");
  let subFrom = `${year}-12-01`;
  let subTo = `${year}-12-07`;
  if (subTo < today) {
    subFrom = `${year + 1}-12-01`;
    subTo = `${year + 1}-12-07`;
  }
  const existingSub = await supabase
    .from("approver_substitutions")
    .select("id")
    .eq("approver_employee_id", robertId)
    .limit(1);
  if (existingSub.error) throw new Error(existingSub.error.message);
  if ((existingSub.data ?? []).length === 0) {
    const inserted = await supabase.from("approver_substitutions").insert({
      approver_employee_id: robertId,
      substitute_employee_id: barbaraId,
      date_from: subFrom,
      date_to: subTo,
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }

  const existingLeave = await supabase
    .from("leave_requests")
    .select("id")
    .eq("employee_id", barbaraId)
    .limit(1);
  if (existingLeave.error) throw new Error(existingLeave.error.message);
  if ((existingLeave.data ?? []).length === 0) {
    const holidayDates = [year, year + 1, year + 2].flatMap((item) =>
      polishHolidays(item).map((holiday) => holiday.date),
    );
    const dateTo = must(shiftIsoDate(today, 4), "termin");
    const workingDays = must(countWorkingDays(today, dateTo, holidayDates), "dni");
    const calendarDays = must(calendarDaysInclusive(today, dateTo), "kalendarz");
    const number = await supabase.rpc("next_leave_number");
    if (number.error || typeof number.data !== "string") throw new Error(number.error?.message ?? "numer");
    const created = await supabase
      .from("leave_requests")
      .insert({
        request_number: number.data,
        employee_id: barbaraId,
        leave_type: "current",
        status: "zaakceptowany",
        date_from: today,
        date_to: dateTo,
        working_days: workingDays,
        calendar_days: calendarDays,
        requires_director: requiresDirector(calendarDays),
        full_day: true,
        planned_hours: workingDays * 8,
        substitute_employee_id: annaId,
        manager_assignee_id: robertId,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (created.error || !created.data) throw new Error(created.error?.message ?? "wniosek");
    const requestId = created.data.id as string;
    const events = [
      { action: "zlozono", actor_id: barbaraId, from_status: null, to_status: "oczekuje_przelozonego" },
      { action: "zaakceptowano", actor_id: robertId, from_status: "oczekuje_przelozonego", to_status: "oczekuje_kadr" },
      { action: "zaakceptowano", actor_id: marekId, from_status: "oczekuje_kadr", to_status: "zaakceptowany" },
    ];
    const history = await supabase.from("leave_events").insert(
      events.map((event) => ({ ...event, request_id: requestId, comment: null })),
    );
    if (history.error) throw new Error(history.error.message);
  }

  console.log("Seed gotowy. Konta używają hasła z SEED_PASSWORD:");
  for (const person of people) console.log(`- ${person.email}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
