import { promises as dns } from "node:dns";
import { isIP } from "node:net";

export type DnsLookup = (
  hostname: string,
  options: { all: true; verbatim: true },
) => Promise<Array<{ address: string; family: 4 | 6 }>>;

export type UrlSecurityErrorCode = "malformed_url" | "blocked_host";

const defaultDnsLookup: DnsLookup = async (hostname, options) => {
  const addresses = await dns.lookup(hostname, options);
  return addresses.map((entry) => ({ address: entry.address, family: entry.family as 4 | 6 }));
};

export class UrlSecurityError extends Error {
  readonly code: UrlSecurityErrorCode;

  constructor(code: UrlSecurityErrorCode, message: string) {
    super(message);
    this.name = "UrlSecurityError";
    this.code = code;
  }
}

function parseIpv4(value: string) {
  const octets = value.split(".");
  if (octets.length !== 4 || octets.some((octet) => !/^\d{1,3}$/.test(octet))) return null;
  const numbers = octets.map(Number);
  if (numbers.some((octet) => octet > 255)) return null;
  return numbers;
}

function ipv4IsBlocked(value: string) {
  const octets = parseIpv4(value);
  if (!octets) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 100 && b >= 64 && b <= 127 ||
    a === 127 ||
    a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 ||
    a === 192 && (b === 0 || b === 168) ||
    a === 198 && (b === 18 || b === 19 || b === 51) ||
    a === 203 && b === 0 ||
    a >= 224
  );
}

function ipv6Bytes(value: string) {
  if (value.includes("%")) return null;
  const rawParts = value.split("::");
  if (rawParts.length > 2) return null;

  const expandPart = (part: string) => {
    if (!part) return [] as number[];
    const parts = part.split(":");
    const output: number[] = [];
    for (const token of parts) {
      if (token.includes(".")) {
        const octets = parseIpv4(token);
        if (!octets) return null;
        output.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
      } else if (/^[0-9a-f]{1,4}$/i.test(token)) {
        output.push(Number.parseInt(token, 16));
      } else {
        return null;
      }
    }
    return output;
  };

  const left = expandPart(rawParts[0]);
  const right = expandPart(rawParts.length === 2 ? rawParts[1] : "");
  if (!left || !right) return null;
  if (rawParts.length === 1 && left.length !== 8) return null;
  if (rawParts.length === 2 && left.length + right.length >= 8) return null;
  const bytes = [...left, ...(rawParts.length === 2 ? Array(8 - left.length - right.length).fill(0) : []), ...right];
  return bytes;
}

function ipv6IsBlocked(value: string) {
  const parts = ipv6Bytes(value);
  if (!parts || parts.length !== 8) return true;
  const first = parts[0];
  const isUnspecified = parts.every((part) => part === 0);
  const isLoopback = parts.slice(0, 7).every((part) => part === 0) && parts[7] === 1;
  const isUla = (first & 0xfe00) === 0xfc00;
  const isLinkLocal = (first & 0xffc0) === 0xfe80;
  const isMulticast = (first & 0xff00) === 0xff00;
  const isDocumentation = parts[0] === 0x2001 && parts[1] === 0x0db8;
  const isIpv4Mapped = parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff;
  const mappedIpv4 = isIpv4Mapped
    ? `${parts[6] >> 8}.${parts[6] & 255}.${parts[7] >> 8}.${parts[7] & 255}`
    : null;
  return isUnspecified || isLoopback || isUla || isLinkLocal || isMulticast || isDocumentation || Boolean(mappedIpv4 && ipv4IsBlocked(mappedIpv4));
}

export function isBlockedIp(address: string) {
  const normalized = address.replace(/^\[|\]$/g, "");
  const family = isIP(normalized);
  if (family === 4) return ipv4IsBlocked(normalized);
  if (family === 6) return ipv6IsBlocked(normalized);
  return true;
}

export function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local");
}

export async function resolveAndValidateUrl(
  input: string,
  lookup: DnsLookup = defaultDnsLookup,
) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UrlSecurityError("malformed_url", "That source URL is not valid.");
  }

  if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.hostname) {
    throw new UrlSecurityError("malformed_url", "Only public HTTP and HTTPS URLs are supported.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(hostname)) {
    throw new UrlSecurityError("blocked_host", "This source host is not allowed.");
  }

  let addresses: Array<{ address: string; family: 4 | 6 }>;
  try {
    const literalFamily = isIP(hostname);
    addresses = literalFamily
      ? [{ address: hostname, family: literalFamily as 4 | 6 }]
      : await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UrlSecurityError("blocked_host", "The source host could not be safely resolved.");
  }

  if (!addresses.length || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new UrlSecurityError("blocked_host", "This source host resolves to a private or internal address.");
  }

  return { url, addresses };
}
