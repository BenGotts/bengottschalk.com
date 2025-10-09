'use server'

import ProposalEmailTemplate from "@/emails/Proposal";
import { ProposalFormSchema } from "@/lib/schemas";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitProposal(formData: unknown) {
  const result = ProposalFormSchema.safeParse(formData);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const { data } = result;
  console.log('Proposal submission:', data);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'no-reply@bengottschalk.com',
      to: process.env.SEND_TO_EMAIL,
      reply_to: data.email,
      subject: `Project Proposal: ${data.projectTitle} - ${data.name}`,
      react: ProposalEmailTemplate(data)
    })
    
    if (error) {
      console.log(error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}

