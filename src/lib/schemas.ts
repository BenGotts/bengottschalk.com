import { z } from "zod";

export const ContactFormSchema = z.object({
  name: z.string({ error: "Name is required" }).min(1),
  email: z.email({ error: "Email is required" }),
  message: z.string({ error: "Message is required" }).min(1),
  // Honeypot: hidden from people, so only bots fill it in. See ContactForm.
  website: z.string().optional(),
});
