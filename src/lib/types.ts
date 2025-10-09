import { z } from "zod"
import { ContactFormSchema, ProposalFormSchema } from "@/lib/schemas";

export type ContactForm = z.infer<typeof ContactFormSchema>;
export type ProposalForm = z.infer<typeof ProposalFormSchema>;

export interface Competition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  date_range: string;
  country_iso2: string;
  city: string;
  url: string;
  website: string;
  event_ids: string[];
  delegates?: { wca_id: string; name: string }[];
  organizers?: { wca_id: string; name: string }[];
  results_posted_at?: string;
}