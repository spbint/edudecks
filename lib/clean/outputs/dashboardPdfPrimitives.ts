import { rgb, type PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";

type PdfColor = ReturnType<typeof rgb>;

export type DashboardPdfComposer = {
  doc: PDFDocument;
  page: PDFPage;
  width: number;
  height: number;
  margin: number;
  footerSpace: number;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
};

export type DashboardPdfPalette = {
  title: PdfColor;
  heading: PdfColor;
  body: PdfColor;
  muted: PdfColor;
  line: PdfColor;
  surface: PdfColor;
  accent: PdfColor;
  accentSurface: PdfColor;
  accentBorder: PdfColor;
  success: PdfColor;
  successSurface: PdfColor;
  successBorder: PdfColor;
  warning: PdfColor;
  warningSurface: PdfColor;
  warningBorder: PdfColor;
  lavender: PdfColor;
  lavenderSurface: PdfColor;
  lavenderBorder: PdfColor;
  neutral: PdfColor;
  neutralSurface: PdfColor;
  neutralBorder: PdfColor;
};

export type DashboardPdfTone = "accent" | "success" | "warning" | "lavender" | "neutral";

export type DashboardPdfMetricTile = {
  label: string;
  value: string;
  helper?: string | null;
  tone?: DashboardPdfTone;
};

export type DashboardPdfStatLine = {
  label: string;
  value: string;
  tone?: DashboardPdfTone;
};

export type DashboardPdfMiniCard = {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  lines?: string[];
  badge?: string | null;
  tone?: DashboardPdfTone;
};

type DrawTextOptions = {
  x: number;
  y: number;
  font: PDFFont;
  fontSize: number;
  lineHeight: number;
  color: PdfColor;
};

type ToneColors = {
  text: PdfColor;
  fill: PdfColor;
  border: PdfColor;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const paragraphs = safe(text)
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((item) => item.trim());
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    });

    if (current) {
      lines.push(current);
    }
  });

  return lines;
}

function measureWrappedLines(lines: string[], lineHeight: number) {
  return lines.reduce(
    (total, line) => total + (line ? lineHeight : lineHeight * 0.55),
    0,
  );
}

function drawPreparedLines<TComposer extends DashboardPdfComposer>(
  composer: TComposer,
  lines: string[],
  options: DrawTextOptions,
) {
  let cursor = options.y;

  lines.forEach((line) => {
    if (!line) {
      cursor -= options.lineHeight * 0.55;
      return;
    }

    composer.page.drawText(line, {
      x: options.x,
      y: cursor,
      size: options.fontSize,
      font: options.font,
      color: options.color,
    });
    cursor -= options.lineHeight;
  });

  return cursor;
}

function ensureSpace<TComposer extends DashboardPdfComposer>(
  composer: TComposer,
  needed: number,
): TComposer {
  if (composer.y - needed > composer.margin + composer.footerSpace) {
    return composer;
  }

  const page = composer.doc.addPage([composer.width, composer.height]);
  return {
    ...composer,
    page,
    y: composer.height - 52,
  };
}

function resolveTone(
  palette: DashboardPdfPalette,
  tone: DashboardPdfTone | undefined,
): ToneColors {
  if (tone === "success") {
    return {
      text: palette.success,
      fill: palette.successSurface,
      border: palette.successBorder,
    };
  }

  if (tone === "warning") {
    return {
      text: palette.warning,
      fill: palette.warningSurface,
      border: palette.warningBorder,
    };
  }

  if (tone === "lavender") {
    return {
      text: palette.lavender,
      fill: palette.lavenderSurface,
      border: palette.lavenderBorder,
    };
  }

  if (tone === "neutral") {
    return {
      text: palette.neutral,
      fill: palette.neutralSurface,
      border: palette.neutralBorder,
    };
  }

  return {
    text: palette.accent,
    fill: palette.accentSurface,
    border: palette.accentBorder,
  };
}

export function drawDashboardHeroCard<TComposer extends DashboardPdfComposer>(
  composer: TComposer,
  palette: DashboardPdfPalette,
  options: {
    eyebrow?: string | null;
    title: string;
    subtitle?: string | null;
    statusLabel?: string | null;
    supportingBadges?: string[];
    note?: string | null;
    statLines?: DashboardPdfStatLine[];
    spacingAfter?: number;
  },
) {
  const totalWidth = composer.width - composer.margin * 2;
  const innerWidth = totalWidth - 32;
  const gap = options.statLines?.length ? 20 : 0;
  const rightWidth = options.statLines?.length ? Math.min(184, innerWidth * 0.36) : 0;
  const leftWidth = options.statLines?.length ? innerWidth - rightWidth - gap : innerWidth;
  const titleLines = wrapText(options.title, composer.bold, 18, leftWidth);
  const subtitleLines = options.subtitle
    ? wrapText(options.subtitle, composer.regular, 10.75, leftWidth)
    : [];
  const badgesLine =
    options.supportingBadges?.filter(Boolean).join("  |  ") || "";
  const badgeLines = badgesLine
    ? wrapText(badgesLine, composer.regular, 9.25, leftWidth)
    : [];
  const noteLines = options.note
    ? wrapText(options.note, composer.regular, 10.25, leftWidth)
    : [];
  const leftHeight =
    (options.eyebrow ? 11 : 0) +
    (options.eyebrow ? 8 : 0) +
    measureWrappedLines(titleLines, 22) +
    (subtitleLines.length ? 10 + measureWrappedLines(subtitleLines, 14) : 0) +
    (badgeLines.length ? 10 + measureWrappedLines(badgeLines, 12) : 0) +
    (noteLines.length ? 12 + measureWrappedLines(noteLines, 14) : 0);

  const statRows = (options.statLines ?? []).map((item) => {
    const valueLines = wrapText(item.value, composer.bold, 11, rightWidth - 18);
    return {
      ...item,
      valueLines,
      height: 10 + 6 + measureWrappedLines(valueLines, 14),
    };
  });
  const rightHeight =
    (options.statusLabel ? 26 : 0) +
    statRows.reduce((sum, row) => sum + row.height, 0) +
    Math.max(0, statRows.length - 1) * 8;

  const totalHeight = 22 + Math.max(leftHeight, rightHeight) + 20;
  const next = ensureSpace(composer, totalHeight + (options.spacingAfter ?? 12));
  const top = next.y;

  next.page.drawRectangle({
    x: next.margin,
    y: top - totalHeight,
    width: totalWidth,
    height: totalHeight,
    color: palette.surface,
    borderColor: palette.accentBorder,
    borderWidth: 1,
  });

  next.page.drawRectangle({
    x: next.margin,
    y: top - totalHeight,
    width: 6,
    height: totalHeight,
    color: palette.accent,
  });

  if (options.statusLabel) {
    const tone = resolveTone(palette, "success");
    const chipWidth = Math.max(
      86,
      composer.bold.widthOfTextAtSize(options.statusLabel, 8.5) + 18,
    );
    next.page.drawRectangle({
      x: next.margin + totalWidth - chipWidth - 16,
      y: top - 16 - 18,
      width: chipWidth,
      height: 18,
      color: tone.fill,
      borderColor: tone.border,
      borderWidth: 1,
    });
    next.page.drawText(options.statusLabel, {
      x: next.margin + totalWidth - chipWidth - 7,
      y: top - 28,
      size: 8.5,
      font: next.bold,
      color: tone.text,
    });
  }

  const leftX = next.margin + 18;
  let leftCursor = top - 20;
  if (options.eyebrow) {
    next.page.drawText(options.eyebrow.toUpperCase(), {
      x: leftX,
      y: leftCursor,
      size: 8.5,
      font: next.bold,
      color: palette.muted,
    });
    leftCursor -= 16;
  }

  leftCursor = drawPreparedLines(next, titleLines, {
    x: leftX,
    y: leftCursor,
    font: next.bold,
    fontSize: 18,
    lineHeight: 22,
    color: palette.title,
  });

  if (subtitleLines.length) {
    leftCursor -= 6;
    leftCursor = drawPreparedLines(next, subtitleLines, {
      x: leftX,
      y: leftCursor,
      font: next.regular,
      fontSize: 10.75,
      lineHeight: 14,
      color: palette.body,
    });
  }

  if (badgeLines.length) {
    leftCursor -= 8;
    leftCursor = drawPreparedLines(next, badgeLines, {
      x: leftX,
      y: leftCursor,
      font: next.regular,
      fontSize: 9.25,
      lineHeight: 12,
      color: palette.muted,
    });
  }

  if (noteLines.length) {
    leftCursor -= 8;
    drawPreparedLines(next, noteLines, {
      x: leftX,
      y: leftCursor,
      font: next.regular,
      fontSize: 10.25,
      lineHeight: 14,
      color: palette.body,
    });
  }

  if (statRows.length) {
    const rightX = next.margin + 18 + leftWidth + gap;
    let rightCursor = top - 22;

    statRows.forEach((row, index) => {
      const tone = resolveTone(palette, row.tone);

      if (index > 0) {
        next.page.drawLine({
          start: { x: rightX, y: rightCursor + 5 },
          end: { x: next.margin + totalWidth - 18, y: rightCursor + 5 },
          thickness: 1,
          color: palette.line,
        });
      }

      next.page.drawText(row.label.toUpperCase(), {
        x: rightX,
        y: rightCursor,
        size: 8.25,
        font: next.bold,
        color: tone.text,
      });

      rightCursor = drawPreparedLines(next, row.valueLines, {
        x: rightX,
        y: rightCursor - 15,
        font: next.bold,
        fontSize: 11,
        lineHeight: 14,
        color: palette.heading,
      });
      rightCursor -= 8;
    });
  }

  next.y = top - totalHeight - (options.spacingAfter ?? 12);
  return next;
}

export function drawDashboardMetricGrid<TComposer extends DashboardPdfComposer>(
  composer: TComposer,
  palette: DashboardPdfPalette,
  tiles: DashboardPdfMetricTile[],
  options?: {
    columns?: number;
    spacingAfter?: number;
  },
) {
  if (!tiles.length) return composer;

  const columnCount = Math.max(1, Math.min(options?.columns ?? 3, tiles.length));
  const gap = 12;
  const totalWidth = composer.width - composer.margin * 2;
  const tileWidth = (totalWidth - gap * (columnCount - 1)) / columnCount;
  const rows: DashboardPdfMetricTile[][] = [];

  for (let index = 0; index < tiles.length; index += columnCount) {
    rows.push(tiles.slice(index, index + columnCount));
  }

  let next = composer;

  rows.forEach((row) => {
    const measured = row.map((tile) => {
      const helperLines = tile.helper
        ? wrapText(tile.helper, next.regular, 8.75, tileWidth - 22)
        : [];

      return {
        tile,
        helperLines,
        height:
          16 +
          10 +
          8 +
          24 +
          (helperLines.length ? 8 + measureWrappedLines(helperLines, 11.5) : 0) +
          12,
      };
    });

    const rowHeight = Math.max(...measured.map((item) => item.height));
    next = ensureSpace(next, rowHeight + (options?.spacingAfter ?? 12));
    const top = next.y;

    measured.forEach((item, index) => {
      const x = next.margin + index * (tileWidth + gap);
      const tone = resolveTone(palette, item.tile.tone);

      next.page.drawRectangle({
        x,
        y: top - rowHeight,
        width: tileWidth,
        height: rowHeight,
        color: tone.fill,
        borderColor: tone.border,
        borderWidth: 1,
      });

      next.page.drawCircle({
        x: x + 16,
        y: top - 18,
        size: 3.5,
        color: tone.text,
      });

      next.page.drawText(item.tile.label.toUpperCase(), {
        x: x + 24,
        y: top - 21,
        size: 8,
        font: next.bold,
        color: tone.text,
      });

      next.page.drawText(item.tile.value, {
        x: x + 16,
        y: top - 48,
        size: 22,
        font: next.bold,
        color: palette.title,
      });

      if (item.helperLines.length) {
        drawPreparedLines(next, item.helperLines, {
          x: x + 16,
          y: top - 66,
          font: next.regular,
          fontSize: 8.75,
          lineHeight: 11.5,
          color: palette.body,
        });
      }
    });

    next.y = top - rowHeight - (options?.spacingAfter ?? 12);
  });

  return next;
}

export function drawDashboardMiniCardGrid<TComposer extends DashboardPdfComposer>(
  composer: TComposer,
  palette: DashboardPdfPalette,
  cards: DashboardPdfMiniCard[],
  options?: {
    columns?: number;
    spacingAfter?: number;
  },
) {
  if (!cards.length) return composer;

  const columnCount = Math.max(1, Math.min(options?.columns ?? 2, cards.length));
  const gap = 12;
  const totalWidth = composer.width - composer.margin * 2;
  const cardWidth = (totalWidth - gap * (columnCount - 1)) / columnCount;
  const rows: DashboardPdfMiniCard[][] = [];

  for (let index = 0; index < cards.length; index += columnCount) {
    rows.push(cards.slice(index, index + columnCount));
  }

  let next = composer;

  rows.forEach((row) => {
    const measured = row.map((card) => {
      const titleWidth = card.badge ? Math.max(110, cardWidth - 118) : cardWidth - 20;
      const titleLines = wrapText(card.title, next.bold, 11.25, titleWidth);
      const descriptionLines = card.description
        ? wrapText(card.description, next.regular, 8.9, cardWidth - 20)
        : [];
      const lineGroups = (card.lines ?? []).map((line) =>
        wrapText(line, next.regular, 8.9, cardWidth - 20),
      );

      return {
        card,
        titleLines,
        descriptionLines,
        lineGroups,
        height:
          16 +
          (card.eyebrow ? 10 + 6 : 0) +
          measureWrappedLines(titleLines, 14) +
          (descriptionLines.length ? 8 + measureWrappedLines(descriptionLines, 11.5) : 0) +
          (lineGroups.length
            ? 10 +
              lineGroups.reduce(
                (sum, group) => sum + measureWrappedLines(group, 11.5),
                0,
              ) +
              Math.max(0, lineGroups.length - 1) * 4
            : 0) +
          12,
      };
    });

    const rowHeight = Math.max(...measured.map((item) => item.height));
    next = ensureSpace(next, rowHeight + (options?.spacingAfter ?? 12));
    const top = next.y;

    measured.forEach((item, index) => {
      const x = next.margin + index * (cardWidth + gap);
      const tone = resolveTone(palette, item.card.tone);

      next.page.drawRectangle({
        x,
        y: top - rowHeight,
        width: cardWidth,
        height: rowHeight,
        color: tone.fill,
        borderColor: tone.border,
        borderWidth: 1,
      });

      if (item.card.badge) {
        const badgeWidth = Math.max(
          66,
          next.bold.widthOfTextAtSize(item.card.badge, 7.75) + 14,
        );
        next.page.drawRectangle({
          x: x + cardWidth - badgeWidth - 12,
          y: top - 14 - 16,
          width: badgeWidth,
          height: 16,
          color: palette.surface,
          borderColor: tone.border,
          borderWidth: 1,
        });
        next.page.drawText(item.card.badge, {
          x: x + cardWidth - badgeWidth - 5,
          y: top - 25,
          size: 7.75,
          font: next.bold,
          color: tone.text,
        });
      }

      let cursor = top - 16;
      if (item.card.eyebrow) {
        next.page.drawText(item.card.eyebrow.toUpperCase(), {
          x: x + 12,
          y: cursor,
          size: 7.75,
          font: next.bold,
          color: palette.muted,
        });
        cursor -= 14;
      }

      cursor = drawPreparedLines(next, item.titleLines, {
        x: x + 12,
        y: cursor,
        font: next.bold,
        fontSize: 11.25,
        lineHeight: 14,
        color: palette.heading,
      });

      if (item.descriptionLines.length) {
        cursor -= 6;
        cursor = drawPreparedLines(next, item.descriptionLines, {
          x: x + 12,
          y: cursor,
          font: next.regular,
          fontSize: 8.9,
          lineHeight: 11.5,
          color: palette.body,
        });
      }

      if (item.lineGroups.length) {
        cursor -= 6;
        item.lineGroups.forEach((group, groupIndex) => {
          cursor = drawPreparedLines(next, group, {
            x: x + 12,
            y: cursor,
            font: next.regular,
            fontSize: 8.9,
            lineHeight: 11.5,
            color: palette.body,
          });
          if (groupIndex < item.lineGroups.length - 1) {
            cursor -= 4;
          }
        });
      }
    });

    next.y = top - rowHeight - (options?.spacingAfter ?? 12);
  });

  return next;
}
