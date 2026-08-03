export type LearningMomentShareFormat = "story" | "post";

export const LEARNING_MOMENT_INVITATION_URL =
  "/start-free?utm_source=mylearna_moment&utm_medium=share&utm_campaign=quick_capture";

export const LEARNING_MOMENT_SHARE_SIZES: Record<LearningMomentShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

export function sanitizePublicCaption(value: string, maxLength = 180) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
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
  includeLearnerName?: boolean;
  includeLearningArea?: boolean;
  includeHashtag?: boolean;
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

  const padding = input.format === "story" ? 72 : 64;
  const imageTop = input.format === "story" ? 190 : 150;
  const imageBottom = input.format === "story" ? 470 : 250;
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
  context.font = "700 38px Arial, sans-serif";
  context.fillText("MyLearna", padding, 92);
  context.fillStyle = "#6c4df6";
  context.font = "600 22px Arial, sans-serif";
  context.fillText("Captured with MyLearna", padding, 132);

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
    drawCoverImage(context, image, padding, imageTop, imageWidth, imageHeight);
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
    input.includeLearnerName ? sanitizePublicCaption(input.learnerLabel ?? "", 60) : "",
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
