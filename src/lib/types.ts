import { z } from "zod"
import { ContactFormSchema } from "@/lib/schemas";

export type ContactForm = z.infer<typeof ContactFormSchema>;

// Minimal shape of the WCA API competition fields the site reads.
export interface WcaCompetitionStaff {
  wca_id: string | null;
}

export interface WcaCompetition {
  id: string;
  name: string;
  url: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  date_range: string;
  event_ids: string[];
  results_posted_at: string | null;
  delegates?: WcaCompetitionStaff[];
  organizers?: WcaCompetitionStaff[];
}

export interface WcaUserCompetitions {
  upcoming_competitions: WcaCompetition[];
  ongoing_competitions: WcaCompetition[];
}
