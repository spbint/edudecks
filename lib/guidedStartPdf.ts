import jsPDF from "jspdf";

export type GuidedStartSession = {
  child: {
    name: string;
    yearLevel?: string;
  };
  plan: {
    category: string;
    title: string;
    suggestedDay?: string;
  };
  calendar: {
    weekLabel?: string;
    scheduledDay?: string;
  };
  capture: {
    happened: string;
    showed?: string;
    note?: string;
  };
  report: {
    summary: string;
  };
  portfolio: {
    previewTitle?: string;
  };
};

const C = {
  green: [76, 175, 122] as const,
  greenSoft: [232, 245, 236] as const,
  blue: [74, 144, 226] as const,
  blueSoft: [234, 242, 251] as const,
  yellow: [244, 197, 66] as const,
  yellowSoft: [255, 246, 216] as const,
  textStrong: [47, 47, 47] as const,
  textSoft: [107, 107, 107] as const,
  paper: [245, 245, 245] as const,
  white: [255, 255, 255] as const,
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function humanizeRunOnWords(value: string) {
  let next = value;
  next = next.replace(/([a-z])([A-Z])/g, "$1 $2");
  next = next.replace(/([a-zA-Z])(\d)/g, "$1 $2");
  next = next.replace(/(\d)([a-zA-Z])/g, "$1 $2");
  next = next.replace(/([a-z])-(?=[a-z])/g, "$1 ");
  next = next.replace(/[_/]+/g, " ");
  return next;
}

function fixCommonTypos(value: string) {
  let next = value;
  next = next.replace(/\bcouldnt\b/gi, "could not");
  next = next.replace(/\bdidnt\b/gi, "did not");
  next = next.replace(/\bwont\b/gi, "will not");
  next = next.replace(/\bcant\b/gi, "can not");
  next = next.replace(/\bim\b/gi, "I am");
  next = next.replace(/\bive\b/gi, "I have");
  next = next.replace(/\bits\b/gi, "it is");
  next = next.replace(/\bwasnt\b/gi, "was not");
  next = next.replace(/\bwerent\b/gi, "were not");
  next = next.replace(/\bnextto\b/gi, "next to");
  next = next.replace(/\bworkon\b/gi, "work on");
  next = next.replace(/\bsplitedigraphs\b/gi, "split digraphs");
  next = next.replace(/\bNexttoworkonsplit-edigraphs\b/gi, "Next to work on split digraphs");
  return next;
}

function removeRepeatedWords(value: string) {
  return value.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
}

function cleanFragment(value: string) {
  let next = safe(value);
  next = humanizeRunOnWords(next);
  next = fixCommonTypos(next);
  next = next.replace(/\s*([,.;:!?])\s*/g, "$1 ");
  next = next.replace(/\s{2,}/g, " ");
  next = removeRepeatedWords(next);
  return normalizeWhitespace(next);
}

function toSentence(value: string, fallback: string) {
  const clean = cleanFragment(value);
  if (!clean) return fallback;

  let next = clean;
  next = next.charAt(0).toUpperCase() + next.slice(1);
  if (!/[.!?]$/.test(next)) next += ".";
  return next;
}

function hasMeaningfulNote(value: string) {
  const clean = cleanFragment(value).toLowerCase();
  if (!clean) return false;
  return !["nothing", "none", "n/a", "na", "no", "nope"].includes(clean);
}

function tryParseDatePart(value: string) {
  const clean = safe(value);
  if (!clean) return null;

  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day);
  }

  const slashMatch = clean.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]) - 1;
    const year = Number(slashMatch[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

function formatSingleDate(value: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${value.getDate()} ${months[value.getMonth()]} ${value.getFullYear()}`;
}

function formatDateRange(value: string) {
  const clean = cleanFragment(value);
  if (!clean) return "This week";

  const parts = clean.split(/\s*-\s*/);
  if (parts.length === 2) {
    const start = tryParseDatePart(parts[0]);
    const end = tryParseDatePart(parts[1]);
    if (start && end) {
      return `${formatSingleDate(start)} – ${formatSingleDate(end)}`;
    }
  }

  const single = tryParseDatePart(clean);
  if (single) return formatSingleDate(single);
  return clean;
}

function learningAreaFromSession(session: GuidedStartSession) {
  const source = `${safe(session.plan.category)} ${safe(session.plan.title)}`.toLowerCase();
  if (source.includes("read")) return "Literacy";
  if (source.includes("math")) return "Numeracy";
  if (source.includes("outdoor")) return "Science";
  return "General Learning";
}

function activityTypeFromSession(session: GuidedStartSession) {
  const source = `${safe(session.plan.category)} ${safe(session.plan.title)}`.toLowerCase();
  if (source.includes("read")) return "Reading";
  if (source.includes("math")) return "Practice Task";
  if (source.includes("outdoor")) return "Observation";
  return "Guided Activity";
}

function evidenceTypeFromSession(session: GuidedStartSession) {
  const source = `${safe(session.capture.happened)} ${safe(session.capture.note)}`.toLowerCase();
  if (source.includes("retold") || source.includes("explained") || source.includes("talk")) {
    return "Learner Voice";
  }
  if (source.includes("observ") || source.includes("noticed")) {
    return "Observation Note";
  }
  return "Learning Record";
}

function buildApproach(session: GuidedStartSession) {
  const category = safe(session.plan.category).toLowerCase();
  if (category.includes("reading")) return "Short guided reading";
  if (category.includes("math")) return "Supported practice";
  if (category.includes("outdoor")) return "Curiosity-led exploration";
  return "Calm weekly routine";
}

function buildWhatWeDid(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "Your child";
  const title = cleanFragment(safe(session.plan.title)) || "one small learning activity";
  const day = safe(session.calendar.scheduledDay);
  const happened = safe(session.capture.happened);

  if (happened) return toSentence(happened, `${childName} completed ${title}.`);
  if (day) return `${childName} completed ${title.toLowerCase()} as part of the ${day.toLowerCase()} plan.`;
  return `${childName} completed ${title.toLowerCase()} as part of this week's guided learning plan.`;
}

function buildWhatThisShows(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "This learner";
  const showed = cleanFragment(safe(session.capture.showed)).toLowerCase();
  const happened = cleanFragment(safe(session.capture.happened)).toLowerCase();
  const note = cleanFragment(safe(session.capture.note)).toLowerCase();
  const area = learningAreaFromSession(session).toLowerCase();

  if (showed.includes("confidence")) {
    return `Confidence in ${area} is growing, and gentle support is helping progress feel achievable.`;
  }
  if (showed.includes("focus") || showed.includes("attention")) {
    return `Focus is strengthening through short, supported learning moments that feel manageable.`;
  }
  if (showed.includes("recall") || showed.includes("retell")) {
    return "Recall is improving, and key ideas can be communicated with growing clarity.";
  }
  if (showed.includes("persist") || showed.includes("persever")) {
    return "Persistence is developing, with a willingness to stay with supported challenge.";
  }
  if (showed.includes("understand") || showed.includes("reason")) {
    return "Emerging understanding is visible, especially when there is space to explain thinking aloud.";
  }
  if (
    happened.includes("could not") ||
    happened.includes("struggle") ||
    happened.includes("hard") ||
    note.includes("split digraph")
  ) {
    return `Confidence in this area is still developing, and guided support with short repeat practice is helping learning move forward.`;
  }

  return `Confidence in ${area} is building through short, meaningful learning moments that can be revisited over time.`;
}

function buildPositiveInsight(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "Your child";
  const area = learningAreaFromSession(session).toLowerCase();
  const showed = cleanFragment(safe(session.capture.showed)).toLowerCase();
  const happened = cleanFragment(safe(session.capture.happened)).toLowerCase();
  const note = cleanFragment(safe(session.capture.note)).toLowerCase();

  if (showed.includes("confidence")) {
    return `${childName} is growing in confidence in ${area}, and short supported practice is helping that confidence hold.`;
  }
  if (showed.includes("focus")) {
    return `${childName} is showing stronger focus and can stay with a small learning task in a calm routine.`;
  }
  if (showed.includes("recall") || happened.includes("retold")) {
    return `${childName} is strengthening recall and can now share back learning in their own words.`;
  }
  if (showed.includes("reason") || happened.includes("explained")) {
    return `${childName} is beginning to explain thinking more clearly and benefits from opportunities to talk ideas through aloud.`;
  }
  if (
    happened.includes("could not") ||
    happened.includes("struggle") ||
    happened.includes("hard") ||
    note.includes("split digraph")
  ) {
    return `${childName} is developing confidence in this area, and guided support is helping learning feel more manageable.`;
  }

  return `${childName} is building a positive foundation in ${area} through small, supported learning moments worth keeping.`;
}

function buildReportSummary(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "This learner";
  const planTitle = cleanFragment(safe(session.plan.title)) || "a guided learning activity";
  const whatWeDid = buildWhatWeDid(session);
  const whatThisShows = buildWhatThisShows(session);
  const note = safe(session.capture.note);

  let summary = `${childName} completed ${planTitle.toLowerCase()} as part of a guided weekly learning plan. `;
  summary += `${whatWeDid} `;
  summary += `${whatThisShows}`;

  if (hasMeaningfulNote(note)) {
    summary += ` An additional note from this moment: ${toSentence(note, cleanFragment(note))}`;
  }

  summary = summary.replace(new RegExp(`\\b${childName}\\b`, "g"), childName);
  summary = summary.replace(
    new RegExp(`\\b${childName}\\b(?=[^]*\\b${childName}\\b)`, "i"),
    childName
  );

  summary = summary
    .replace(/([.?!])\s+([A-Z][a-z]+)\s+completed\b/, "$1 The learner completed")
    .replace(/([.?!])\s+([A-Z][a-z]+)\s+is\b/, "$1 They are")
    .replace(/([.?!])\s+([A-Z][a-z]+)\s+can\b/, "$1 They can");

  return normalizeWhitespace(summary);
}

function buildNextStep(session: GuidedStartSession) {
  const source = cleanFragment(
    `${safe(session.plan.category)} ${safe(session.capture.showed)} ${safe(session.capture.happened)} ${safe(session.capture.note)}`
  ).toLowerCase();

  if (source.includes("reading") || source.includes("recall") || source.includes("retold")) {
    return "Continue with short shared reading and encourage retelling in your child's own words.";
  }
  if (source.includes("math")) {
    return "Continue with one short supported maths task and encourage verbal reasoning while working it out.";
  }
  if (source.includes("outdoor") || source.includes("observ")) {
    return "Continue with another short observation activity and encourage clear noticing and description.";
  }
  if (source.includes("split digraph") || source.includes("confidence") || source.includes("struggle")) {
    return "Continue with short supported practice in this area and encourage calm verbal reasoning as confidence builds.";
  }
  return "Continue with another short guided task and encourage your child to explain what they noticed, remembered, or understood.";
}

function setFill(doc: jsPDF, rgb: readonly number[]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: readonly number[]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawWrappedText(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 16) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return lines.length * lineHeight;
}

function drawSoftCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: readonly number[],
  radius = 14
) {
  setFill(doc, fill);
  doc.setDrawColor(fill[0], fill[1], fill[2]);
  doc.roundedRect(x, y, w, h, radius, radius, "FD");
}

function drawPill(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  fill: readonly number[],
  textRgb: readonly number[]
) {
  const width = Math.max(74, doc.getTextWidth(text) + 24);
  drawSoftCard(doc, x, y, width, 24, fill, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, textRgb);
  doc.text(text, x + 12, y + 16);
  return width;
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.textSoft);
  doc.text("Created with EduDecks Family", 48, pageHeight - 50);
  doc.text("Helping you build your child's learning story", 48, pageHeight - 34);
  doc.text("Save this record to continue building your child's learning journey.", 48, pageHeight - 18);
}

export async function buildGuidedStartPdf(session: GuidedStartSession): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const childName = safe(session.child.name) || "Your child";
  const title = `${childName}'s Learning Record`;
  const supportLine = "A moment of learning, captured and celebrated.";
  const insight = buildPositiveInsight(session);
  const whatWeDid = buildWhatWeDid(session);
  const whatThisShows = buildWhatThisShows(session);
  const reportSummary = buildReportSummary(session);
  const nextStep = buildNextStep(session);
  const learningArea = learningAreaFromSession(session);
  const activityType = activityTypeFromSession(session);
  const evidenceType = evidenceTypeFromSession(session);
  const weekRange = formatDateRange(safe(session.calendar.weekLabel));
  const learningFocus = cleanFragment(safe(session.plan.title)) || "Guided learning activity";
  const approach = buildApproach(session);
  const scheduleLine = `${safe(session.calendar.scheduledDay) || "This week"} – ${weekRange}`;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  setFill(doc, C.green);
  doc.rect(0, 0, pageWidth, 72, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.greenSoft);
  doc.text("GUIDED HOMESCHOOL RECORD", margin, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setText(doc, C.white);
  doc.text("EduDecks Family", margin, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Guided Learning Record", pageWidth - margin, 46, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  setText(doc, C.textStrong);
  doc.text(title, margin, 114);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textSoft);
  doc.text("A guided homeschool moment", margin, 138);
  doc.text(supportLine, margin, 158);

  drawSoftCard(doc, margin, 188, contentWidth, 118, C.greenSoft, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.green);
  doc.text("HIGHLIGHT", margin + 22, 214);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setText(doc, C.textStrong);
  drawWrappedText(doc, insight, margin + 22, 244, contentWidth - 44, 22);

  drawSoftCard(doc, margin, 334, contentWidth, 184, C.paper, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setText(doc, C.textStrong);
  doc.text("Learning Snapshot", margin + 20, 362);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.textSoft);
  doc.text("WHAT WE DID", margin + 20, 392);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textStrong);
  drawWrappedText(doc, whatWeDid, margin + 20, 416, contentWidth - 40, 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.textSoft);
  doc.text("WHAT THIS SHOWS", margin + 20, 462);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textStrong);
  drawWrappedText(doc, whatThisShows, margin + 20, 486, contentWidth - 40, 19);

  drawSoftCard(doc, margin, 542, contentWidth, 104, C.blueSoft, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.blue);
  doc.text("WEEK CONTEXT", margin + 20, 568);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, C.textSoft);
  doc.text("WEEK RANGE", margin + 20, 596);
  doc.text("LEARNING FOCUS", margin + 190, 596);
  doc.text("APPROACH", margin + 392, 596);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  drawWrappedText(doc, weekRange, margin + 20, 618, 150, 16);
  drawWrappedText(doc, learningFocus, margin + 190, 618, 180, 16);
  drawWrappedText(doc, approach, margin + 392, 618, 120, 16);

  addFooter(doc);

  doc.addPage();

  setFill(doc, C.blue);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setText(doc, C.blueSoft);
  doc.text("REPORT VIEW", margin, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setText(doc, C.textStrong);
  doc.text("Report Summary", margin, 94);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textSoft);
  doc.text("A calm, report-ready summary built from your guided record.", margin, 118);

  drawSoftCard(doc, margin, 150, contentWidth, 188, C.white, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  setText(doc, C.textStrong);
  drawWrappedText(doc, reportSummary, margin + 22, 182, contentWidth - 44, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.textSoft);
  doc.text(`This record contributes to ${childName}'s growing learning portfolio.`, margin, 364);

  drawSoftCard(doc, margin, 390, contentWidth, 92, C.yellowSoft, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.yellow);
  doc.text("NEXT STEP", margin + 20, 416);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textStrong);
  drawWrappedText(doc, nextStep, margin + 20, 444, contentWidth - 40, 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.textSoft);
  doc.text("TAGS", margin, 516);

  let pillX = margin;
  pillX += drawPill(doc, pillX, 528, learningArea, C.greenSoft, C.green) + 10;
  pillX += drawPill(doc, pillX, 528, activityType, C.blueSoft, C.blue) + 10;
  drawPill(doc, pillX, 528, evidenceType, C.yellowSoft, [143, 108, 12]);

  drawSoftCard(doc, margin, 582, contentWidth, 116, C.paper, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  doc.text("Record Overview", margin + 20, 608);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, C.textSoft);
  doc.text("CHILD", margin + 20, 636);
  doc.text("PLAN", margin + 196, 636);
  doc.text("SCHEDULE", margin + 372, 636);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  drawWrappedText(
    doc,
    `${childName}${safe(session.child.yearLevel) ? ` – ${cleanFragment(safe(session.child.yearLevel))}` : ""}`,
    margin + 20,
    658,
    150,
    16
  );
  drawWrappedText(doc, learningFocus, margin + 196, 658, 150, 16);
  drawWrappedText(doc, scheduleLine, margin + 372, 658, 140, 16);

  addFooter(doc);

  return doc.output("blob");
}
