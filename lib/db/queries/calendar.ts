import "server-only";
import { dbError, getDb } from "@/lib/db/client";
import type { Substitution } from "@/lib/leave/workflow";

/** Daty świąt jako YYYY-MM-DD. Sobót i niedziel tu nie ma. */
export async function listHolidayDates(): Promise<string[]> {
  const { data, error } = await getDb().from("public_holidays").select("holiday_date");
  if (error) throw dbError(error);
  return (data ?? []).map((row) => row.holiday_date as string);
}

export async function listSubstitutions(): Promise<Substitution[]> {
  const { data, error } = await getDb()
    .from("approver_substitutions")
    .select("approver_employee_id, substitute_employee_id, date_from, date_to");
  if (error) throw dbError(error);
  return (data ?? []).map((row) => ({
    approverEmployeeId: row.approver_employee_id as string,
    substituteEmployeeId: row.substitute_employee_id as string,
    dateFrom: row.date_from as string,
    dateTo: row.date_to as string,
  }));
}
