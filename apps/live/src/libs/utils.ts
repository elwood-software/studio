import { extname } from "../deps.ts";

export function isHttpUrl(val: string): boolean {
  return val.startsWith("http:") || val.startsWith("https:");
}

export function isFalsy(value: unknown): boolean {
  return value === undefined || value === null || value === false;
}

export async function wait(time = 1000) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
}

export function isVideo(filePath: string): boolean {
  return [".mov", ".mp4"].includes(extname(filePath));
}

export function isImage(filePath: string): boolean {
  return [".jpeg", ".jpg", ".png", ".gif"].includes(extname(filePath));
}

export function base64UrlEncode(data: Record<string, unknown>): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(JSON.stringify(data));

  // Convert Base64 to Base64URL (replace +, / and remove =)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(
    /\//g,
    "_",
  ).replace(/=+$/, "");
}
