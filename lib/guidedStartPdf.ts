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

function cleanFragment(value: string) {
  let next = safe(value);
  next = humanizeRunOnWords(next);
  next = fixCommonTypos(next);
  next = next.replace(/\s*([,.;:!?])\s*/g, "$1 ");
  next = next.replace(/\s{2,}/g, " ");
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
    return `${childName} is developing confidence in ${area} and is responding well to gentle guidance.`;
  }
  if (showed.includes("focus") || showed.includes("attention")) {
    return `${childName} was able to stay engaged with the task and is building stronger focus through short, supported learning moments.`;
  }
  if (showed.includes("recall") || showed.includes("retell")) {
    return `${childName} is strengthening recall and can communicate key ideas with growing clarity.`;
  }
  if (showed.includes("persist") || showed.includes("persever")) {
    return `${childName} is building persistence and is willing to keep working through supported challenge.`;
  }
  if (showed.includes("understand") || showed.includes("reason")) {
    return `${childName} is showing emerging understanding and can explain parts of their thinking with support.`;
  }
  if (
    happened.includes("could not") ||
    happened.includes("struggle") ||
    happened.includes("hard") ||
    note.includes("split digraph")
  ) {
    return `${childName} is developing confidence in this area and benefits from guided support and small repeat practice.`;
  }

  return `${childName} is building confidence in ${area} through short, meaningful learning moments that can be revisited over time.`;
}

function buildPositiveInsight(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "Your child";
  const area = learningAreaFromSession(session).toLowerCase();
  const showed = cleanFragment(safe(session.capture.showed)).toLowerCase();
  const happened = cleanFragment(safe(session.capture.happened)).toLowerCase();
  const note = cleanFragment(safe(session.capture.note)).toLowerCase();

  if (showed.includes("confidence")) {
    return `${childName} is growing in confidence in ${area} and is responding well to short supported practice.`;
  }
  if (showed.includes("focus")) {
    return `${childName} is showing stronger focus and is able to stay with a small learning task in a calm routine.`;
  }
  if (showed.includes("recall") || happened.includes("retold")) {
    return `${childName} is strengthening recall and can share back learning in their own words.`;
  }
  if (showed.includes("reason") || happened.includes("explained")) {
    return `${childName} is beginning to explain their thinking and benefits from opportunities to talk through ideas aloud.`;
  }
  if (
    happened.includes("could not") ||
    happened.includes("struggle") ||
    happened.includes("hard") ||
    note.includes("split digraph")
  ) {
    return `${childName} is developing confidence in this area and benefits from guided support and short repeat experiences.`;
  }

  return `${childName} is building a positive foundation in ${area} through small, supported learning moments that are worth keeping.`;
}

function buildReportSummary(session: GuidedStartSession) {
  const childName = safe(session.child.name) || "This learner";
  const planTitle = cleanFragment(safe(session.plan.title)) || "a guided learning activity";
  const whatWeDid = buildWhatWeDid(session);
  const whatThisShows = buildWhatThisShows(session);
  const note = safe(session.capture.note);

  let summary = `${childName} completed ${planTitle.toLowerCase()} as part of a guided weekly learning plan. ${whatWeDid} ${whatThisShows}`;
  if (note) {
    summary += ` A further note from this moment: ${toSentence(note, cleanFragment(note))}`;
  }
  return normalizeWhitespace(summary);
}

function buildNextStep(session: GuidedStartSession) {
  const source = cleanFragment(
    `${safe(session.plan.category)} ${safe(session.capture.showed)} ${safe(session.capture.happened)} ${safe(session.capture.note)}`
  ).toLowerCase();

  if (source.includes("reading") || source.includes("recall") || source.includes("retold")) {
    return "Continue with short shared reading and invite your child to retell key ideas in their own words.";
  }
  if (source.includes("math")) {
    return "Continue with one short supported maths task and encourage your child to explain how they worked it out.";
  }
  if (source.includes("outdoor") || source.includes("observ")) {
    return "Continue with another short observation task and invite your child to describe what they notice and why it matters.";
  }
  if (source.includes("split digraph") || source.includes("confidence") || source.includes("struggle")) {
    return "Continue with short supported practice in this area and encourage verbal reasoning so confidence can build steadily.";
  }
  return "Repeat this type of short guided task next week and invite your child to explain what they noticed, remembered, or understood.";
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
  doc.text("Created with EduDecks Family", 48, pageHeight - 42);
  doc.text("Helping you build your child's learning story", 48, pageHeight - 28);
  doc.text("Save this record to continue building your child's learning journey.", 48, pageHeight - 14);
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
  const weekRange = cleanFragment(safe(session.calendar.weekLabel)) || "This week";
  const learningFocus = cleanFragment(safe(session.plan.title)) || "Guided learning activity";
  const approach = buildApproach(session);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  setFill(doc, C.green);
  doc.rect(0, 0, pageWidth, 68, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.greenSoft);
  doc.text("GUIDED HOMESCHOOL RECORD", margin, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setText(doc, C.white);
  doc.text("EduDecks Family", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Guided Learning Record", pageWidth - margin, 44, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setText(doc, C.textStrong);
  doc.text(title, margin, 106);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textSoft);
  doc.text("A guided homeschool moment", margin, 128);
  doc.text(supportLine, margin, 146);

  drawSoftCard(doc, margin, 170, contentWidth, 104, C.greenSoft, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.green);
  doc.text("HIGHLIGHT", margin + 18, 194);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(doc, C.textStrong);
  drawWrappedText(doc, insight, margin + 18, 220, contentWidth - 36, 20);

  drawSoftCard(doc, margin, 294, contentWidth, 174, C.paper, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  doc.text("Learning Snapshot", margin + 18, 320);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.textSoft);
  doc.text("WHAT WE DID", margin + 18, 348);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textStrong);
  drawWrappedText(doc, whatWeDid, margin + 18, 370, contentWidth - 36, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.textSoft);
  doc.text("WHAT THIS SHOWS", margin + 18, 412);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textStrong);
  drawWrappedText(doc, whatThisShows, margin + 18, 434, contentWidth - 36, 18);

  drawSoftCard(doc, margin, 490, contentWidth, 92, C.blueSoft, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.blue);
  doc.text("WEEK CONTEXT", margin + 18, 514);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, C.textSoft);
  doc.text("WEEK RANGE", margin + 18, 540);
  doc.text("LEARNING FOCUS", margin + 190, 540);
  doc.text("APPROACH", margin + 392, 540);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  drawWrappedText(doc, weekRange, margin + 18, 560, 150, 15);
  drawWrappedText(doc, learningFocus, margin + 190, 560, 180, 15);
  drawWrappedText(doc, approach, margin + 392, 560, 120, 15);

  addFooter(doc);

  doc.addPage();

  setFill(doc, C.blue);
  doc.rect(0, 0, pageWidth, 48, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setText(doc, C.blueSoft);
  doc.text("REPORT VIEW", margin, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setText(doc, C.textStrong);
  doc.text("Report Summary", margin, 88);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textSoft);
  doc.text("A calm, report-ready summary built from your guided record.", margin, 110);

  drawSoftCard(doc, margin, 138, contentWidth, 176, C.white, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  setText(doc, C.textStrong);
  drawWrappedText(doc, reportSummary, margin + 20, 168, contentWidth - 40, 20);

  drawSoftCard(doc, margin, 338, contentWidth, 88, C.yellowSoft, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.yellow);
  doc.text("NEXT STEP", margin + 18, 362);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(doc, C.textStrong);
  drawWrappedText(doc, nextStep, margin + 18, 388, contentWidth - 36, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.textSoft);
  doc.text("TAGS", margin, 458);

  let pillX = margin;
  pillX += drawPill(doc, pillX, 470, learningArea, C.greenSoft, C.green) + 10;
  pillX += drawPill(doc, pillX, 470, activityType, C.blueSoft, C.blue) + 10;
  drawPill(doc, pillX, 470, evidenceType, C.yellowSoft, [143, 108, 12]);

  drawSoftCard(doc, margin, 524, contentWidth, 124, C.paper, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  doc.text("Record Overview", margin + 18, 548);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, C.textSoft);
  doc.text("CHILD", margin + 18, 574);
  doc.text("PLAN", margin + 196, 574);
  doc.text("SCHEDULE", margin + 374, 574);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.textStrong);
  drawWrappedText(
    doc,
    `${childName}${safe(session.child.yearLevel) ? ` - ${cleanFragment(safe(session.child.yearLevel))}` : ""}`,
    margin + 18,
    594,
    150,
    15
  );
  drawWrappedText(doc, learningFocus, margin + 196, 594, 150, 15);
  drawWrappedText(
    doc,
    `${safe(session.calendar.scheduledDay) || "This week"}${weekRange ? ` - ${weekRange}` : ""}`,
    margin + 374,
    594,
    140,
    15
  );

  addFooter(doc);

  return doc.output("blob");
}
