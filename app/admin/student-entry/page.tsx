// 🔥 ONLY CHANGE is inside loadExisting()

async function loadExisting() {
  if (!editId) return;

  const tries = [
    "id,class_id,first_name,preferred_name,surname,is_ilp,status,is_archived,created_at",
    "id,class_id,first_name,preferred_name,family_name,is_ilp,status,is_archived,created_at",
    "id,class_id,first_name,preferred_name,surname,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,family_name,is_ilp,is_archived,created_at",
    "id,class_id,first_name,preferred_name,surname,created_at",
    "id,class_id,first_name,preferred_name,family_name,created_at",
  ];

  for (const sel of tries) {
    const r = await supabase.from("students").select(sel).eq("id", editId).single();

    if (!r.error) {
      // ✅ FIXED LINE
      const s = (r.data as unknown) as StudentRow;

      setExisting(s);

      setClassId(s.class_id ?? classIdParam ?? "");
      setFirstName(s.first_name ?? "");
      setPreferredName(s.preferred_name ?? "");
      setSurname((s as any).surname ?? (s as any).family_name ?? "");
      setIsIlp(!!s.is_ilp);
      setStatus(safe(s.status) || "active");
      setIsArchived(!!s.is_archived);

      return;
    }

    if (!isMissingColumnError(r.error)) throw r.error;
  }
}