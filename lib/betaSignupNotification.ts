type BetaSignupNotificationInput = {
  biggest_homeschool_challenge: string;
  country: string;
  currently_homeschooling: boolean | null;
  email: string;
  name: string;
  number_of_children: number | null;
  source: string | null;
  state_or_region: string | null;
  submitted_at: string;
  willing_to_test_free_beta: boolean;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || safe(value) === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return safe(value);
}

function buildPlainTextBody(input: BetaSignupNotificationInput) {
  return [
    "New MyLearna beta signup",
    "",
    `Name: ${formatValue(input.name)}`,
    `Email: ${formatValue(input.email)}`,
    `Country: ${formatValue(input.country)}`,
    `State or region: ${formatValue(input.state_or_region)}`,
    `Number of children: ${formatValue(input.number_of_children)}`,
    `Currently homeschooling: ${formatValue(input.currently_homeschooling)}`,
    `Willing to test free beta: ${formatValue(input.willing_to_test_free_beta)}`,
    `Source: ${formatValue(input.source)}`,
    `Submitted at: ${formatValue(input.submitted_at)}`,
    "",
    "Biggest homeschool challenge:",
    formatValue(input.biggest_homeschool_challenge),
  ].join("\n");
}

export async function sendOwnerBetaSignupNotification(
  input: BetaSignupNotificationInput,
) {
  const apiKey = safe(process.env.RESEND_API_KEY);
  const ownerEmail = safe(
    process.env.OWNER_SIGNUP_ALERT_EMAIL || "sean@mylearna.com",
  );
  const fromEmail = safe(process.env.FROM_EMAIL);

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY for beta signup notification.");
  }

  if (!fromEmail) {
    throw new Error("Missing FROM_EMAIL for beta signup notification.");
  }

  const subjectName = safe(input.name) || safe(input.email) || "new signup";
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ownerEmail,
      subject: `New MyLearna beta signup - ${subjectName}`,
      text: buildPlainTextBody(input),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Resend beta signup notification failed with ${response.status}: ${errorText}`,
    );
  }
}

export type { BetaSignupNotificationInput };
