'use server'

import ContactEmailTemplate from "@/emails/Contact";
import { ContactFormSchema } from "@/lib/schemas";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function contact(formData: unknown) {
  const parsed = ContactFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  // A filled honeypot means a bot. Report success so it has nothing to adapt to.
  if (parsed.data.website) {
    return { success: true, data: null };
  }

  const sendTo = process.env.SEND_TO_EMAIL;
  if (!sendTo) {
    console.error("SEND_TO_EMAIL is not set");
    return { success: false, error: "Contact form is not configured" };
  }

  const { name, email, message } = parsed.data;

  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@bengottschalk.com',
      to: sendTo,
      replyTo: email,
      subject: `Contact Form from ${name}`,
      react: ContactEmailTemplate({ name, message })
    })
    if (error) {
      console.error(error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to send message" };
  }
}
