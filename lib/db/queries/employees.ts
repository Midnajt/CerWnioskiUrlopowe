import "server-only";
import { dbError, getDb } from "@/lib/db/client";
import type { Employee, EmployeeOption } from "@/lib/types";

type EmployeeRow = {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  employee_number: string;
  department_id: string;
  location_id: string;
  job_title: string;
  manager_id: string | null;
  fte: number | string;
  is_director: boolean;
  is_hr: boolean;
  active: boolean;
  departments: { name: string } | { name: string }[] | null;
  locations: { name: string } | { name: string }[] | null;
};

function relationName(value: { name: string } | { name: string }[] | null): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0]?.name ?? "";
  return value.name;
}

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    employeeNumber: row.employee_number,
    departmentId: row.department_id,
    departmentName: relationName(row.departments),
    locationId: row.location_id,
    locationName: relationName(row.locations),
    jobTitle: row.job_title,
    managerId: row.manager_id,
    fte: Number(row.fte),
    isDirector: row.is_director,
    isHr: row.is_hr,
    active: row.active,
  };
}

const EMPLOYEE_SELECT =
  "id, auth_user_id, first_name, last_name, employee_number, department_id, location_id, job_title, manager_id, fte, is_director, is_hr, active, departments(name), locations(name)";

/** Pracownik powiązany z kontem Auth. */
export async function getEmployeeByAuthId(authUserId: string): Promise<Employee | null> {
  const { data, error } = await getDb()
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!data) return null;
  return mapEmployee(data as EmployeeRow);
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await getDb()
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw dbError(error);
  if (!data) return null;
  return mapEmployee(data as EmployeeRow);
}

export async function listActiveEmployees(): Promise<EmployeeOption[]> {
  const { data, error } = await getDb()
    .from("employees")
    .select("id, first_name, last_name, job_title, active")
    .eq("active", true)
    .order("last_name");
  if (error) throw dbError(error);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    jobTitle: row.job_title as string,
    active: row.active as boolean,
  }));
}

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await getDb().from("employees").select(EMPLOYEE_SELECT).order("last_name");
  if (error) throw dbError(error);
  return ((data ?? []) as EmployeeRow[]).map(mapEmployee);
}

export async function listDirectors(): Promise<Employee[]> {
  const { data, error } = await getDb()
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("is_director", true)
    .eq("active", true)
    .order("last_name");
  if (error) throw dbError(error);
  return ((data ?? []) as EmployeeRow[]).map(mapEmployee);
}

export async function listSubordinates(managerId: string): Promise<Employee[]> {
  const { data, error } = await getDb()
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("manager_id", managerId)
    .eq("active", true)
    .order("last_name");
  if (error) throw dbError(error);
  return ((data ?? []) as EmployeeRow[]).map(mapEmployee);
}

export async function countHr(): Promise<number> {
  const { count, error } = await getDb()
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("is_hr", true)
    .eq("active", true);
  if (error) throw dbError(error);
  return count ?? 0;
}
