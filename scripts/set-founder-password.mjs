/*
 * Local/admin-only workflow (PowerShell):
 * $secure = Read-Host "Enter new Founder password" -AsSecureString
 * $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 * $env:FOUNDER_NEW_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 * npm.cmd run founder:set-password
 * Remove-Item Env:FOUNDER_NEW_PASSWORD
 * [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
 */
import { createClient } from "@supabase/supabase-js";

const FOUNDER_EMAIL = "sean@mylearna.com";
const MIN_PASSWORD_LENGTH = 16;

function requirePassword() {
  const password = process.env.FOUNDER_NEW_PASSWORD;
  if (!password) throw new Error("FOUNDER_NEW_PASSWORD is required.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("FOUNDER_NEW_PASSWORD must be at least 16 characters.");
  }
  return password;
}

function createFounderAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error("Founder service credentials are unavailable.");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function findFounderUser(admin) {
  const matches = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) throw new Error("Founder Auth users could not be listed.");
    matches.push(...data.users.filter((user) => user.email === FOUNDER_EMAIL));
    if (data.users.length < 1000) break;
  }
  if (matches.length === 0) throw new Error("Founder Auth user was not found.");
  if (matches.length !== 1) throw new Error("Multiple unexpected Founder Auth users were found.");
  return matches[0].id;
}

async function main() {
  const password = requirePassword();
  const admin = createFounderAdminClient();
  const userId = await findFounderUser(admin);
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error("Founder password update failed.");
  console.log("Founder password updated successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Founder password update failed.");
  process.exitCode = 1;
});
