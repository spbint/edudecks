// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const familyEvidenceMocks = vi.hoisted(() => ({
  updateFamilyEvidenceEntryAttachments: vi.fn(),
  uploadFamilyEvidenceFiles: vi.fn(),
}));

vi.mock("@/lib/familyEvidence", () => familyEvidenceMocks);
vi.mock("@/lib/clean/evidence/imagePreparation", () => ({
  compressCleanEvidenceImage: vi.fn(async (file: File) => file),
}));

import { useCleanEvidenceAttachments } from "@/lib/clean/evidence/useCleanEvidenceAttachments";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const uploadedAttachment = {
  label: "evidence.jpg",
  path: "family/family-1/learner/learner-1/evidence/evidence-1/evidence.jpg",
  mimeType: "image/jpeg",
  size: 128,
  kind: "image" as const,
};

describe("slow and retrying attachment uploads", () => {
  beforeEach(() => {
    familyEvidenceMocks.updateFamilyEvidenceEntryAttachments.mockReset();
    familyEvidenceMocks.uploadFamilyEvidenceFiles.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("keeps the selected file while announcing slow upload and finalise phases", async () => {
    const uploadDeferred = deferred<{
      uploaded: Array<typeof uploadedAttachment>;
      failed: never[];
    }>();
    const updateDeferred = deferred<{
      attachmentUrls: string[];
      imageUrl: string | null;
      fileUrl: string | null;
    }>();
    familyEvidenceMocks.uploadFamilyEvidenceFiles.mockReturnValue(uploadDeferred.promise);
    familyEvidenceMocks.updateFamilyEvidenceEntryAttachments.mockReturnValue(
      updateDeferred.promise,
    );

    const phases: string[] = [];
    const { result } = renderHook(() => useCleanEvidenceAttachments());
    const file = new File(["image"], "evidence.jpg", { type: "image/jpeg" });
    act(() => result.current.hydratePhoto(file));

    let uploadPromise!: ReturnType<typeof result.current.uploadSelectedAttachments>;
    act(() => {
      uploadPromise = result.current.uploadSelectedAttachments({
        familyProfileId: "family-1",
        studentId: "learner-1",
        evidenceId: "evidence-1",
        setPhase: (phase) => phases.push(phase),
      });
    });

    await waitFor(() => expect(phases).toEqual(["Uploading evidence"]));
    expect(result.current.photoFile).toBe(file);

    uploadDeferred.resolve({ uploaded: [uploadedAttachment], failed: [] });
    await waitFor(() => expect(phases).toContain("Finalising evidence"));
    expect(result.current.photoFile).toBe(file);

    updateDeferred.resolve({
      attachmentUrls: [uploadedAttachment.path],
      imageUrl: uploadedAttachment.path,
      fileUrl: null,
    });
    await expect(uploadPromise).resolves.toEqual([uploadedAttachment]);
  });

  it("retains the selected file after failure so an explicit retry can succeed", async () => {
    familyEvidenceMocks.uploadFamilyEvidenceFiles
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useCleanEvidenceAttachments());
    const file = new File(["image"], "evidence.jpg", { type: "image/jpeg" });
    act(() => result.current.hydratePhoto(file));

    await expect(
      result.current.uploadSelectedAttachments({
        familyProfileId: "family-1",
        studentId: "learner-1",
        evidenceId: "evidence-1",
      }),
    ).rejects.toThrow("offline");
    expect(result.current.photoFile).toBe(file);

    familyEvidenceMocks.uploadFamilyEvidenceFiles.mockResolvedValue({
      uploaded: [uploadedAttachment],
      failed: [],
    });
    familyEvidenceMocks.updateFamilyEvidenceEntryAttachments.mockResolvedValue({
      attachmentUrls: [uploadedAttachment.path],
      imageUrl: uploadedAttachment.path,
      fileUrl: null,
    });

    await expect(
      result.current.uploadSelectedAttachments({
        familyProfileId: "family-1",
        studentId: "learner-1",
        evidenceId: "evidence-1",
      }),
    ).resolves.toEqual([uploadedAttachment]);
  });
});
