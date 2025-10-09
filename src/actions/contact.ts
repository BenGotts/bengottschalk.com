'use server'

import ContactEmailTemplate from "@/emails/Contact";
import { ContactFormSchema } from "@/lib/schemas";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function contact(formData: unknown) {
  const result = ContactFormSchema.safeParse(formData);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  const { name, email, message } = result.data;
  console.log(name, email, message);

  const toEmail = process.env.SEND_TO_EMAIL;
  if (!toEmail) {
    return { success: false, error: 'Email configuration missing' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@bengottschalk.com',
      to: toEmail,
      reply_to: email,
      subject: `Contact Form from ${name}`,
      react: ContactEmailTemplate({ name, message })
    })
    if (error) {
      console.log(error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}