import { describe, expect, it } from "vitest";
import { parseServiceAccountKey } from "./service-account";

function toBase64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

describe("parseServiceAccountKey", () => {
  it("dekoduje poprawny klucz base64 do ServiceAccount", () => {
    const b64 = toBase64({
      project_id: "domowka-test",
      client_email: "sa@domowka-test.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    });
    const sa = parseServiceAccountKey(b64);
    expect(sa.projectId).toBe("domowka-test");
    expect(sa.clientEmail).toBe("sa@domowka-test.iam.gserviceaccount.com");
    expect(sa.privateKey).toContain("BEGIN PRIVATE KEY");
  });

  it("rzuca, gdy zmienna jest pusta", () => {
    expect(() => parseServiceAccountKey("")).toThrow(/FIREBASE_SERVICE_ACCOUNT_KEY/);
  });

  it("rzuca, gdy brakuje wymaganych pól", () => {
    const b64 = toBase64({ project_id: "x" });
    expect(() => parseServiceAccountKey(b64)).toThrow(/project_id \/ client_email \/ private_key/);
  });
});
