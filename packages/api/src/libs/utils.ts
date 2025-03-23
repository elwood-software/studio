import { createHash } from "node:crypto";

export function sha256(src: string): string {
  return createHash("sha256").update(src).digest().toString("base64url");
}

export default {
  sha256,
};
