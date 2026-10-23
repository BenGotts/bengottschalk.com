import type { Metadata } from "next";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact | bengottschalk.com",
  description: "Get in touch with Benjamin Gottschalk.",
}

export default function ContactPage() {
  return <ContactForm />
}
