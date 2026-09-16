export const LEAKED_PASSWORD_CHANGE_MESSAGE =
  "That password appears in a known data breach. Choose a new, unique password that you do not use anywhere else.";

export const LEAKED_PASSWORD_SIGN_IN_MESSAGE =
  "That password appears in a known data breach. Use Forgot password? to replace it with a new, unique password.";

export const LEAKED_PASSWORD_FOUNDER_SIGN_IN_MESSAGE =
  "That password appears in a known data breach. Use Set or reset Founder password to replace it with a new, unique password.";

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function isWeakPasswordError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
  };
  const code = normalized(candidate.code);
  const name = normalized(candidate.name).replace(/[^a-z]/g, "");
  const message = normalized(candidate.message);

  return (
    code === "weak_password" ||
    name === "weakpassworderror" ||
    message.includes("weak password") ||
    message.includes("known data breach") ||
    message.includes("leaked password") ||
    message.includes("password has been pwned")
  );
}
