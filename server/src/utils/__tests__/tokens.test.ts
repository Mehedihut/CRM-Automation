import { describe, expect, it } from "vitest";
import { generateRawToken, hashToken } from "../tokens";

describe("tokens.generateRawToken", () => {
  it("returns a non-empty url-safe string", () => {
    const t = generateRawToken();
    expect(t.length).toBeGreaterThan(0);
    expect(/^[A-Za-z0-9_-]+$/.test(t)).toBe(true);
  });

  it("returns a different value on each call", () => {
    const a = generateRawToken();
    const b = generateRawToken();
    expect(a).not.toBe(b);
  });

  it("honors the byte count for output length", () => {
    // 16 bytes → 22 chars in base64url (no padding)
    const t = generateRawToken(16);
    expect(t.length).toBe(22);
  });
});

describe("tokens.hashToken", () => {
  it("produces a 64-char hex sha256 digest", () => {
    const h = hashToken("hello");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashToken("x")).toBe(hashToken("x"));
  });

  it("changes when input changes", () => {
    expect(hashToken("x")).not.toBe(hashToken("y"));
  });
});