"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import StudentQuickViewDrawer from "@/app/admin/components/StudentQuickViewDrawer";

type QuickOpenOptions = {
  returnTo?: string;
};

type StudentQuickViewContextValue = {
  isOpen: boolean;
  studentId: string | null;
  returnTo?: string;

  openStudent: (id: string, options?: QuickOpenOptions) => void;
  open: (id: string, options?: QuickOpenOptions) => void;
  openStudentQuickView: (id: string, options?: QuickOpenOptions) => void;

  close: () => void;
  refresh: () => void;
};

const StudentQuickViewContext = createContext<StudentQuickViewContextValue | null>(null);

export function useStudentQuickView() {
  const ctx = useContext(StudentQuickViewContext);
  if (!ctx) {
    throw new Error("useStudentQuickView must be used inside StudentQuickViewProvider");
  }
  return ctx;
}

export default function StudentQuickViewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  // used to force remount / reload of drawer when refresh() is called
  const [drawerInstanceKey, setDrawerInstanceKey] = useState(0);

  const openStudent = (id: string, options?: QuickOpenOptions) => {
    if (!id) return;
    setStudentId(id);
    setReturnTo(options?.returnTo);
    setIsOpen(true);
  };

  const open = (id: string, options?: QuickOpenOptions) => {
    if (!id) return;
    setStudentId(id);
    setReturnTo(options?.returnTo);
    setIsOpen(true);
  };

  const openStudentQuickView = (id: string, options?: QuickOpenOptions) => {
    if (!id) return;
    setStudentId(id);
    setReturnTo(options?.returnTo);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const refresh = () => {
    setDrawerInstanceKey((v) => v + 1);
  };

  const value = useMemo<StudentQuickViewContextValue>(
    () => ({
      isOpen,
      studentId,
      returnTo,
      openStudent,
      open,
      openStudentQuickView,
      close,
      refresh,
    }),
    [isOpen, studentId, returnTo]
  );

  return (
    <StudentQuickViewContext.Provider value={value}>
      {children}

      <StudentQuickViewDrawer
        key={`${studentId ?? "none"}_${drawerInstanceKey}`}
        studentId={studentId}
        open={isOpen}
        onClose={close}
        returnTo={returnTo}
      />
    </StudentQuickViewContext.Provider>
  );
}