import { z } from "zod";

/** What a message is about, chosen on the contact form; it goes in the email subject. */
export const CONTACT_TOPICS = ["Competitions", "Cubing", "Software", "Just saying hi"] as const;

export const ContactFormSchema = z.object({
  name: z.string({ error: "Name is required" }).min(1),
  email: z.email({ error: "Email is required" }),
  message: z.string({ error: "Message is required" }).min(1),
  topic: z.enum(CONTACT_TOPICS).optional(),
  // Honeypot: hidden from people, so only bots fill it in. See ContactForm.
  website: z.string().optional(),
});
