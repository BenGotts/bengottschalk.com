import { describe, expect, it } from "vitest";
import { ContactFormSchema } from "./schemas";

const valid = { name: "Ada", email: "ada@example.com", message: "Hi!" };

describe("ContactFormSchema", () => {
  it("accepts a normal submission with an empty honeypot", () => {
    expect(ContactFormSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
    expect(ContactFormSchema.safeParse(valid).success).toBe(true);
  });

  it("keeps the honeypot value so the action can drop bot submissions", () => {
    expect(ContactFormSchema.parse({ ...valid, website: "spam.example" }).website).toBe("spam.example");
  });

  it("accepts a known topic, or none", () => {
    expect(ContactFormSchema.parse({ ...valid, topic: "Competitions" }).topic).toBe("Competitions");
    expect(ContactFormSchema.safeParse({ ...valid, topic: "Spam" }).success).toBe(false);
  });

  it("rejects missing or invalid fields", () => {
    expect(ContactFormSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(ContactFormSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });
});
