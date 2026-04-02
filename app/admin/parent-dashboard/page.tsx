async function loadStudents() {
  let lastErr: any = null;

  const variants = [
    "id,class_id,preferred_name,first_name,surname,is_ilp,year_level,created_at",
    "id,class_id,preferred_name,first_name,family_name,is_ilp,year_level,created_at",
    "id,class_id,preferred_name,first_name,last_name,is_ilp,year_level,created_at",
    "id,class_id,preferred_name,first_name,is_ilp,year_level,created_at",
  ];

  for (const select of variants) {
    const res = await supabase
      .from("students")
      .select(select)
      .order("preferred_name", { ascending: true });

    if (!res.error) {
      return ((res.data || []) as unknown) as StudentRow[];
    }

    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}