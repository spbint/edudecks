export type LearningMomentShareFormat = "story" | "post";
export type LearningMomentImageTreatment = "fit" | "fill";
export type LearningMomentLearnerNameChoice = "hidden" | "initial" | "first-name";

export const LEARNING_MOMENT_INVITATION_URL =
  "/start-free?utm_source=mylearna_moment&utm_medium=share&utm_campaign=quick_capture";

export const LEARNING_MOMENT_SHARE_SIZES: Record<LearningMomentShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

export function sanitizePublicCaption(value: string, maxLength = 180) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function formatPublicLearnerName(
  value: string | null | undefined,
  choice: LearningMomentLearnerNameChoice,
) {
  if (choice === "hidden") return "";
  const firstName = sanitizePublicCaption(value ?? "", 60).split(/\s+/)[0] ?? "";
  if (!firstName) return "";
  return choice === "initial" ? `${firstName.charAt(0).toUpperCase()}.` : firstName;
}

export function buildLearningMomentShareText(input: {
  caption?: string | null;
  includeHashtag?: boolean;
}) {
  const caption = sanitizePublicCaption(input.caption ?? "");
  const hashtag = input.includeHashtag === false ? "" : "#MyLearnaMoment";
  return [caption, hashtag, LEARNING_MOMENT_INVITATION_URL].filter(Boolean).join("\n\n");
}

export function buildLearningMomentShareFilename(format: LearningMomentShareFormat) {
  return `mylearna-learning-moment-${format}.png`;
}

export function canUseNativeLearningMomentShare(
  navigatorLike: Pick<Navigator, "share" | "canShare"> | null | undefined,
  file?: File | null,
) {
  if (!navigatorLike || typeof navigatorLike.share !== "function") return false;
  if (!file || typeof navigatorLike.canShare !== "function") return true;
  try {
    return navigatorLike.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceRatio = image.width / image.height || 1;
  const targetRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawContainImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.width / image.height || 1;
  const targetRatio = width / height;
  const drawWidth = imageRatio > targetRatio ? width : height * imageRatio;
  const drawHeight = imageRatio > targetRatio ? width / imageRatio : height;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export async function renderLearningMomentShareCard(input: {
  format: LearningMomentShareFormat;
  imageSource?: string | null;
  publicCaption?: string | null;
  learnerLabel?: string | null;
  learningArea?: string | null;
  learnerNameChoice?: LearningMomentLearnerNameChoice;
  includeLearningArea?: boolean;
  includeHashtag?: boolean;
  includeTagline?: boolean;
  imageTreatment?: LearningMomentImageTreatment;
}) {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("Share cards can only be created in a browser.");
  }

  const size = LEARNING_MOMENT_SHARE_SIZES[input.format];
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Share card rendering is not available in this browser.");

  const padding = input.format === "story" ? 84 : 72;
  const imageTop = input.format === "story" ? 214 : 174;
  const imageBottom = input.format === "story" ? 510 : 336;
  const imageWidth = size.width - padding * 2;
  const imageHeight = size.height - imageTop - imageBottom;

  context.fillStyle = "#f7f9fc";
  context.fillRect(0, 0, size.width, size.height);
  const background = context.createLinearGradient(0, 0, size.width, size.height);
  background.addColorStop(0, "#f7f4ff");
  background.addColorStop(1, "#effbf6");
  context.fillStyle = background;
  context.fillRect(0, 0, size.width, size.height);

  context.fillStyle = "#17204b";
  context.font = "700 42px Arial, sans-serif";
  context.fillText("MyLearna Moment", padding, 88);
  context.fillStyle = "#6c4df6";
  context.font = "600 22px Arial, sans-serif";
  context.fillText("Captured with MyLearna", padding, 128);

  context.save();
  context.beginPath();
  context.roundRect(padding, imageTop, imageWidth, imageHeight, 34);
  context.clip();
  if (input.imageSource) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      if (/^https?:/i.test(input.imageSource ?? "")) nextImage.crossOrigin = "anonymous";
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("The selected photo could not be added to the share card."));
      nextImage.src = input.imageSource ?? "";
    });
    if (input.imageTreatment !== "fill") {
      context.save();
      context.filter = "blur(34px)";
      context.globalAlpha = 0.36;
      drawCoverImage(context, image, padding - 40, imageTop - 40, imageWidth + 80, imageHeight + 80);
      context.restore();
      context.fillStyle = "rgba(255,255,255,0.22)";
      context.fillRect(padding, imageTop, imageWidth, imageHeight);
      drawContainImage(context, image, padding, imageTop, imageWidth, imageHeight);
    } else {
      drawCoverImage(context, image, padding, imageTop, imageWidth, imageHeight);
    }
  } else {
    context.fillStyle = "#e9e4ff";
    context.fillRect(padding, imageTop, imageWidth, imageHeight);
    context.fillStyle = "#6c4df6";
    context.font = "700 34px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("A learning moment", size.width / 2, imageTop + imageHeight / 2);
    context.textAlign = "left";
  }
  context.restore();

  const caption = sanitizePublicCaption(input.publicCaption ?? "");
  let textY = size.height - imageBottom + 42;
  context.fillStyle = "#17204b";
  context.font = "700 32px Arial, sans-serif";
  if (caption) {
    const lines = wrapCanvasText(context, caption, imageWidth, input.format === "story" ? 4 : 3);
    for (const line of lines) {
      context.fillText(line, padding, textY);
      textY += 42;
    }
  }

  const optionalLabels = [
    formatPublicLearnerName(input.learnerLabel, input.learnerNameChoice ?? "hidden"),
    input.includeLearningArea ? sanitizePublicCaption(input.learningArea ?? "", 60) : "",
  ].filter(Boolean);
  if (optionalLabels.length) {
    context.fillStyle = "#5b6478";
    context.font = "600 24px Arial, sans-serif";
    context.fillText(optionalLabels.join(" · "), padding, textY + 10);
    textY += 48;
  }

  if (input.includeHashtag !== false) {
    context.fillStyle = "#6c4df6";
    context.font = "700 24px Arial, sans-serif";
    context.fillText("#MyLearnaMoment", padding, textY + 12);
    textY += 42;
  }

  if (input.includeTagline) {
    context.fillStyle = "#5b6478";
    context.font = "600 22px Arial, sans-serif";
    context.fillText("Learning happens everywhere.", padding, textY + 12);
  }

  context.fillStyle = "#5b6478";
  context.font = "600 22px Arial, sans-serif";
  context.fillText("Plan · Capture · Grow", padding, size.height - 42);
  context.textAlign = "left";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The share card could not be exported."));
    }, "image/png");
  });
}
