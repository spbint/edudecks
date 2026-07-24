"use client";

import type { GeneratedSequenceItem } from "@/lib/intelligence/plans/types";
import SequenceEditor from "./SequenceEditor";

export default function LessonSequenceEditor({ values, onChange }: { values: GeneratedSequenceItem[]; onChange: (values: GeneratedSequenceItem[]) => void }) {
  return <SequenceEditor label="Lesson sequence" values={values} onChange={onChange} />;
}
