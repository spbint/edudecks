"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { compressCleanEvidenceImage } from "@/lib/clean/evidence/imagePreparation";
import {
  CLEAN_CAPTURE_MAX_FILE_BYTES,
  CLEAN_CAPTURE_MAX_IMAGE_BYTES,
  isSupportedCleanCaptureImage,
  isSupportedCleanCaptureFile,
} from "@/lib/clean/evidence/attachmentPolicy";
import {
  updateFamilyEvidenceEntryAttachments,
  uploadFamilyEvidenceFiles,
  type UploadedFamilyEvidenceFile,
} from "@/lib/familyEvidence";

export type CleanEvidenceAttachmentUploadOptions = {
  familyProfileId: string;
  studentId: string;
  evidenceId: string;
  setPhase?: (phase: string) => void;
};

export type CleanEvidenceAttachmentState = {
  photoFile: File | null;
  photoName: string;
  photoPreviewUrl: string;
  photoSelectionMessage: string;
  evidenceFile: File | null;
  evidenceFileName: string;
  fileSelectionMessage: string;
  attachmentError: string;
  selectedFiles: File[];
  hasSelectedAttachments: boolean;
  setPhotoSelectionMessage: (message: string) => void;
  hydratePhoto: (file: File | null) => void;
  handlePhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleEvidenceFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  removePhoto: () => void;
  removeEvidenceFile: () => void;
  clearSelectedAttachments: () => void;
  clearAttachmentError: () => void;
  validateSelectedAttachments: () => string | null;
  uploadSelectedAttachments: (
    options: CleanEvidenceAttachmentUploadOptions,
  ) => Promise<UploadedFamilyEvidenceFile[]>;
};

function attachmentMetadata(uploaded: UploadedFamilyEvidenceFile[]) {
  return uploaded.map((attachment) => ({
    path: attachment.path,
    name: attachment.label,
    mimeType: attachment.mimeType,
    size: attachment.size,
    kind: attachment.kind,
  }));
}

export function assertStoredAttachmentsConfirmed(
  uploaded: UploadedFamilyEvidenceFile[],
  stored: { attachmentUrls: string[]; imageUrl: string | null; fileUrl: string | null },
) {
  const storedText = stored.attachmentUrls.join("\n");
  const missing = uploaded.find(
    (attachment) =>
      !storedText.includes(attachment.path) &&
      stored.imageUrl !== attachment.path &&
      stored.fileUrl !== attachment.path,
  );
  if (missing) {
    throw new Error("Evidence attachment update did not confirm the uploaded attachment reference.");
  }
}

export function useCleanEvidenceAttachments(): CleanEvidenceAttachmentState {
  const preparedImagePromisesRef = useRef(new Map<File, Promise<File>>());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoSelectionMessage, setPhotoSelectionMessage] = useState("No photo attached yet.");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [fileSelectionMessage, setFileSelectionMessage] = useState("No file attached yet.");
  const [attachmentError, setAttachmentError] = useState("");

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const prepareImage = useCallback((file: File) => {
    const existing = preparedImagePromisesRef.current.get(file);
    if (existing) return existing;
    const prepared = compressCleanEvidenceImage(file);
    preparedImagePromisesRef.current.set(file, prepared);
    return prepared;
  }, []);

  const hydratePhoto = useCallback((file: File | null) => {
    setPhotoFile(file);
    setPhotoName(file?.name ?? "");
    setPhotoSelectionMessage(file ? "Photo attached." : "No photo attached yet.");
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
    if (file?.type.startsWith("image/")) {
      void Promise.resolve().then(() => prepareImage(file)).catch(() => undefined);
    }
  }, [prepareImage]);

  const handlePhotoChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAttachmentError("");
    if (file && !isSupportedCleanCaptureImage(file)) {
      setAttachmentError("Choose a JPEG, PNG, WebP, or GIF image for this learning moment.");
      event.currentTarget.value = "";
      return;
    }
    if (file && file.size > CLEAN_CAPTURE_MAX_IMAGE_BYTES) {
      setAttachmentError("Choose an image smaller than 10 MB.");
      event.currentTarget.value = "";
      return;
    }
    hydratePhoto(file);
    event.currentTarget.value = "";
  }, [hydratePhoto]);

  const handleEvidenceFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAttachmentError("");
    if (file && !isSupportedCleanCaptureFile(file)) {
      setAttachmentError("Choose a JPEG, PNG, WebP, GIF, PDF, Word, or text file.");
      event.currentTarget.value = "";
      return;
    }
    if (file && file.size > CLEAN_CAPTURE_MAX_FILE_BYTES) {
      setAttachmentError("Choose a file smaller than 10 MB.");
      event.currentTarget.value = "";
      return;
    }
    setEvidenceFile(file);
    setEvidenceFileName(file?.name ?? "");
    setFileSelectionMessage(file ? "File attached and ready to save." : "No file was selected.");
    event.currentTarget.value = "";
  }, []);

  const removePhoto = useCallback(() => {
    hydratePhoto(null);
    setAttachmentError("");
  }, [hydratePhoto]);

  const removeEvidenceFile = useCallback(() => {
    setEvidenceFile(null);
    setEvidenceFileName("");
    setFileSelectionMessage("No file attached yet.");
    setAttachmentError("");
  }, []);

  const clearSelectedAttachments = useCallback(() => {
    hydratePhoto(null);
    setEvidenceFile(null);
    setEvidenceFileName("");
    setFileSelectionMessage("No file attached yet.");
    setAttachmentError("");
  }, [hydratePhoto]);

  const validateSelectedAttachments = useCallback(() => {
    if (photoFile && (!isSupportedCleanCaptureImage(photoFile) || photoFile.size > CLEAN_CAPTURE_MAX_IMAGE_BYTES)) {
      return photoFile.size > CLEAN_CAPTURE_MAX_IMAGE_BYTES
        ? "Choose an image smaller than 10 MB."
        : "Choose a JPEG, PNG, WebP, or GIF image for this learning moment.";
    }
    if (evidenceFile && !isSupportedCleanCaptureFile(evidenceFile)) {
      return "Choose a JPEG, PNG, WebP, GIF, PDF, Word, or text file.";
    }
    if (evidenceFile && evidenceFile.size > CLEAN_CAPTURE_MAX_FILE_BYTES) {
      return "Choose a file smaller than 10 MB.";
    }
    return null;
  }, [evidenceFile, photoFile]);

  const uploadSelectedAttachments = useCallback(async ({
    familyProfileId,
    studentId,
    evidenceId,
    setPhase,
  }: CleanEvidenceAttachmentUploadOptions) => {
    const validationError = validateSelectedAttachments();
    if (validationError) {
      setAttachmentError(validationError);
      throw new Error(validationError);
    }

    const files = [photoFile, evidenceFile].filter(Boolean) as File[];
    if (!files.length) return [];

    const preparedFiles = await Promise.all(
      files.map((file) => (file.type.startsWith("image/") ? prepareImage(file) : file)),
    );
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const currentValidationError = validateSelectedAttachments();
        if (currentValidationError) {
          setAttachmentError(currentValidationError);
          throw new Error(currentValidationError);
        }
        setPhase?.("Uploading evidence");
        const uploadResult = await uploadFamilyEvidenceFiles({
          familyProfileId,
          studentId,
          evidenceId,
          files: preparedFiles,
        });
        if (uploadResult.failed.length) {
          throw new Error(uploadResult.failed.map((failure) => `${failure.name}: ${failure.message}`).join(" "));
        }
        if (!uploadResult.uploaded.length) {
          throw new Error("No attachment was uploaded. Please try again.");
        }

        setPhase?.("Finalising evidence");
        const stored = await updateFamilyEvidenceEntryAttachments({
          evidenceId,
          attachmentUrls: attachmentMetadata(uploadResult.uploaded),
          imageUrl: uploadResult.uploaded.find((attachment) => attachment.kind === "image")?.path ?? null,
          fileUrl: uploadResult.uploaded.find((attachment) => attachment.kind === "file")?.path ?? null,
        });
        assertStoredAttachmentsConfirmed(uploadResult.uploaded, stored);
        return uploadResult.uploaded;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Attachment upload failed.");
        if (attempt === 2) throw lastError;
      }
    }
    throw lastError ?? new Error("Attachment upload failed. Check your connection and try again.");
  }, [evidenceFile, photoFile, prepareImage, validateSelectedAttachments]);

  const selectedFiles = useMemo(
    () => [photoFile, evidenceFile].filter(Boolean) as File[],
    [evidenceFile, photoFile],
  );

  return {
    photoFile,
    photoName,
    photoPreviewUrl,
    photoSelectionMessage,
    evidenceFile,
    evidenceFileName,
    fileSelectionMessage,
    attachmentError,
    selectedFiles,
    hasSelectedAttachments: selectedFiles.length > 0,
    setPhotoSelectionMessage,
    hydratePhoto,
    handlePhotoChange,
    handleEvidenceFileChange,
    removePhoto,
    removeEvidenceFile,
    clearSelectedAttachments,
    clearAttachmentError: () => setAttachmentError(""),
    validateSelectedAttachments,
    uploadSelectedAttachments,
  };
}
