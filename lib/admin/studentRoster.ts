import { supabase } from "@/lib/supabaseClient";

type StudentRow = {
  id?: string | null;
  class_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
};

function safeString(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function buildDisplayName(row: StudentRow) {
  const first = safeString(row.preferred_name || row.first_name);
  const last = safeString(row.surname || row.family_name || row.last_name);
  const full = `${first} ${last}`.trim();
  return full || "Student";
}

export type AdminStudentInfo = {
  id: string;
  classId: string | null;
  displayName: string;
};

export async function fetchAdminStudents(): Promise<AdminStudentInfo[]> {
  const { data } = await supabase
    .from("students")
    .select("id,class_id,preferred_name,first_name,surname,family_name,last_name")
    .order("preferred_name", { ascending: true })
    .limit(1000);

  if (!Array.isArray(data)) return [];

  return data
    .map((row) => {
      const id = safeString(row.id);
      if (!id) return null;

      return {
        id,
        classId: safeString(row.class_id) || null,
        displayName: buildDisplayName(row),
      };
    })
    .filter((item): item is AdminStudentInfo => item !== null);
}
