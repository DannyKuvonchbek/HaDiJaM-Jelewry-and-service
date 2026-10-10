import { ForbiddenException, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";
export function allowedOrigins(): string[] {
  const production = ["https://hadijam.com", "https://www.hadijam.com"];
  return process.env.NODE_ENV === "production"
    ? production
    : [...production, "http://localhost:1017", "http://127.0.0.1:1017", "http://localhost:3017", "http://127.0.0.1:3017"];
}
export function requireBrowserRequest(req: Request): void {
  if (
    !allowedOrigins().includes(String(req.headers.origin)) ||
    req.headers["x-hadijam-csrf"] !== "1"
  ) {
    throw new ForbiddenException("Untrusted authentication request.");
  }
}
export const refreshCookieName = () =>
  process.env.NODE_ENV === "production"
    ? "__Host-hadijam-refresh"
    : "hadijam-refresh";
export function readRefresh(req: Request): string {
  const cookie = (req.headers.cookie ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(refreshCookieName() + "="));
  try {
    return cookie
      ? decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1))
      : "";
  } catch {
    return "";
  }
}
export function setRefresh(res: Response, value: string, expires: Date): void {
  res.cookie(refreshCookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  res.setHeader("Cache-Control", "no-store");
}
export function clearRefresh(res: Response): void {
  res.clearCookie(refreshCookieName(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
// Fixed-window, bounded process-local limiter. Use one PM2 API process; see deployment guide.
const buckets = new Map<string, { count: number; until: number }>();
export function limitAuth(req: Request, action: string, maximum = 20): void {
  const now = Date.now();
  for (const [key, value] of buckets)
    if (value.until <= now) buckets.delete(key);
  if (buckets.size >= 10000)
    throw new HttpException("Please try again later.", 429);
  const key = `${action}:${req.ip}`;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { count: 0, until: now + 60000 };
    buckets.set(key, bucket);
  }
  if (++bucket.count > maximum)
    throw new HttpException(
      "Too many authentication attempts. Please try again later.",
      429,
    );
}
