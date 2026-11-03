import "server-only";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/auth/supabase";
import { getEmployeeByAuthId } from "@/lib/db";
import type { Employee } from "@/lib/types";

export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return getEmployeeByAuthId(data.user.id);
}

export async function requireEmployee(): Promise<Employee> {
  let employee: Employee | null = null;
  try {
    employee = await getCurrentEmployee();
  } catch {
    redirect("/login?error=konfiguracja");
  }
  if (!employee) redirect("/login");
  return employee;
}
