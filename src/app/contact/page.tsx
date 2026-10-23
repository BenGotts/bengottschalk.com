import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with Ben Gottschalk.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactForm />
}
