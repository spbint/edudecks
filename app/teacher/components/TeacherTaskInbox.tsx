"use client";

import React, { useMemo } from "react";

type TeacherTask = {
  id: string;
  class_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  due_on?: string | null;
  [k: string]: any;
};

type TeacherTaskInboxProps = {
  tasks?: TeacherTask[] | null;
  classId?: string | null;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

export default function TeacherTaskInbox({
  tasks = [],
  classId = "",
}: TeacherTaskInboxProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const tasksForClass = useMemo(() => {
    if (!classId) return safeTasks;
    return safeTasks.filter((t) => !t?.class_id || t.class_id === classId);
  }, [safeTasks, classId]);

  return (
    <div
      style={{
        border: "1px solid #e8eaf0",
        borderRadius: 18,
        background: "#fff",
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 950,
          color: "#0f172a",
        }}
      >
        Teacher Task Inbox
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          color: "#64748b",
          fontWeight: 800,
          lineHeight: 1.45,
        }}
      >
        Tasks relevant to this class or general teacher actions.
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {tasksForClass.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 14,
              background: "#f8fafc",
              padding: 12,
              color: "#64748b",
              fontWeight: 900,
            }}
          >
            No tasks to show.
          </div>
        ) : (
          tasksForClass.map((t) => (
            <div
              key={safe(t.id) || Math.random()}
              style={{
                border: "1px solid #edf2f7",
                borderRadius: 14,
                background: "#fff",
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 950, color: "#0f172a" }}>
                {safe(t.title) || "Task"}
              </div>

              {safe(t.description) ? (
                <div
                  style={{
                    marginTop: 6,
                    color: "#475569",
                    fontWeight: 800,
                    lineHeight: 1.4,
                  }}
                >
                  {safe(t.description)}
                </div>
              ) : null}

              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {safe(t.status) ? (
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    {safe(t.status)}
                  </span>
                ) : null}

                {safe(t.due_on) ? (
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#f8fafc",
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#475569",
                    }}
                  >
                    Due {safe(t.due_on)}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}