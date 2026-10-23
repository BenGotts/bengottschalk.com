'use client'

import { contact } from "@/actions/contact";
import { ContactFormSchema } from "@/lib/schemas";
import { useState } from "react";

// Inputs use the muted color for their border so the field outline meets
// the 3:1 non-text contrast minimum.
const fieldClass = "w-full border-muted";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");

    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    }

    const result = ContactFormSchema.safeParse(contactData);
    if (!result.success) {
      setError("Please check your inputs and try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await contact(result.data);
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError("An error occurred while sending your message. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-bold">Thank You!</h1>
        <p className="mt-4 text-lg text-muted">
          Your message has been sent successfully. I'll get back to you soon.
        </p>
        <button type="button" onClick={() => setIsSubmitted(false)} className="btn btn-primary mt-6">
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-4xl font-bold">Get in Touch</h1>
      <p className="mt-4 text-lg text-muted">
        Have a question or want to work together? Fill out the form below and I'll get back to you as soon as
        possible.
      </p>
      {error && (
        <div role="alert" className="alert alert-error mt-6">{error}</div>
      )}
      <form action={clientAction} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input id="name" name="name" type="text" autoComplete="name" required className={`input ${fieldClass}`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={`input ${fieldClass}`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-sm font-medium">Message</label>
          <textarea id="message" name="message" rows={5} required className={`textarea ${fieldClass}`} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
