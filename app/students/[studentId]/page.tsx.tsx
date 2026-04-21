"use client";

import { useParams } from "next/navigation";

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = String(params?.studentId ?? "");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0, fontSize: 28, fontWeight: 900 }}>Student Profile</h1>
      <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, maxWidth: 720 }}>
        Student detail tools are temporarily simplified during rebuild.
        {studentId ? ` Viewing student ${studentId}.` : ""}
      </p>
    </div>
  );
}
