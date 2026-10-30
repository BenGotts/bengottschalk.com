import { z } from "zod"
import { ContactFormSchema } from "@/lib/schemas";

export type ContactForm = z.infer<typeof ContactFormSchema>;
