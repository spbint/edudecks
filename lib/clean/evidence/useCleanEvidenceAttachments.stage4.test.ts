// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const familyEvidenceMocks = vi.hoisted(() => ({
  updateFamilyEvidenceEntryAttachments: vi.fn(),
  uploadFamilyEvidenceFiles: vi.fn(),
}));
const imagePreparationMocks = vi.hoisted(() => ({
  compressCleanEvidenceImage: vi.fn(async (file: File) => file),
}));

vi.mock("@/lib/familyEvidence", () => familyEvidenceMocks);
vi.mock("@/lib/clean/evidence/imagePreparation", () => ({
  compressCleanEvidenceImage: imagePreparationMocks.compressCleanEvidenceImage,
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
    imagePreparationMocks.compressCleanEvidenceImage.mockReset();
    imagePreparationMocks.compressCleanEvidenceImage.mockImplementation(async (file: File) => file);
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

  it("shows a local preview first and shares one background image preparation with Save", async () => {
    const compression = deferred<File>();
    imagePreparationMocks.compressCleanEvidenceImage.mockReturnValue(compression.promise);
    familyEvidenceMocks.uploadFamilyEvidenceFiles.mockResolvedValue({ uploaded: [uploadedAttachment], failed: [] });
    familyEvidenceMocks.updateFamilyEvidenceEntryAttachments.mockResolvedValue({
      attachmentUrls: [uploadedAttachment.path], imageUrl: uploadedAttachment.path, fileUrl: null,
    });
    const { result } = renderHook(() => useCleanEvidenceAttachments());
    const file = new File(["image"], "evidence.jpg", { type: "image/jpeg" });

    act(() => result.current.hydratePhoto(file));
    expect(result.current.photoFile).toBe(file);
    expect(result.current.photoPreviewUrl).toBe("blob:preview");
    await waitFor(() => expect(imagePreparationMocks.compressCleanEvidenceImage).toHaveBeenCalledTimes(1));

    const uploadPromise = result.current.uploadSelectedAttachments({ familyProfileId: "family-1", studentId: "learner-1", evidenceId: "evidence-1" });
    expect(familyEvidenceMocks.uploadFamilyEvidenceFiles).not.toHaveBeenCalled();
    compression.resolve(file);
    await expect(uploadPromise).resolves.toEqual([uploadedAttachment]);
    expect(imagePreparationMocks.compressCleanEvidenceImage).toHaveBeenCalledTimes(1);
  });

  it("never uploads a removed or replaced photo preparation", async () => {
    const oldFile = new File(["old"], "old.jpg", { type: "image/jpeg" });
    const newFile = new File(["new"], "new.jpg", { type: "image/jpeg" });
    familyEvidenceMocks.uploadFamilyEvidenceFiles.mockResolvedValue({ uploaded: [uploadedAttachment], failed: [] });
    familyEvidenceMocks.updateFamilyEvidenceEntryAttachments.mockResolvedValue({
      attachmentUrls: [uploadedAttachment.path], imageUrl: uploadedAttachment.path, fileUrl: null,
    });
    const { result } = renderHook(() => useCleanEvidenceAttachments());

    act(() => result.current.hydratePhoto(oldFile));
    act(() => result.current.hydratePhoto(newFile));
    await waitFor(() => expect(imagePreparationMocks.compressCleanEvidenceImage).toHaveBeenCalledTimes(2));
    await result.current.uploadSelectedAttachments({ familyProfileId: "family-1", studentId: "learner-1", evidenceId: "evidence-1" });
    expect(familyEvidenceMocks.uploadFamilyEvidenceFiles.mock.calls[0][0].files).toEqual([newFile]);

    act(() => result.current.removePhoto());
    expect(result.current.hasSelectedAttachments).toBe(false);
  });
});
