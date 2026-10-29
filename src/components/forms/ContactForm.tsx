'use client'

import { contact } from "@/actions/contact";
import CubeStripe from "@/components/CubeStripe";
import TwistyCube from "@/components/TwistyCube";
import { CONTACT_TOPICS, ContactFormSchema } from "@/lib/schemas";
import { useState } from "react";

// Inputs use the muted color for their border so the field outline meets
// the 3:1 non-text contrast minimum.
const fieldClass = "w-full border-muted bg-base-100";

type Topic = (typeof CONTACT_TOPICS)[number];

// Each topic lights up in its own cube color when picked.
const TOPIC_CLASS: Record<Topic, string> = {
  Competitions: "aria-pressed:border-secondary aria-pressed:bg-secondary/15",
  Cubing: "aria-pressed:border-primary aria-pressed:bg-primary/15",
  Software: "aria-pressed:border-ink-orange aria-pressed:bg-ink-orange/15",
  "Just saying hi": "aria-pressed:border-ink-yellow aria-pressed:bg-ink-yellow/15",
};

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState<Topic | null>(null);

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");

    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      topic: formData.get('topic') || undefined,
      website: formData.get('website') ?? undefined,
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
        setTopic(null);
      } else {
        setError("An error occurred while sending your message. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-box border border-base-300 bg-base-200">
      <CubeStripe />
      {isSubmitted ? (
        // <output> has the implicit "status" role, so screen readers announce the confirmation.
        <output className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-8">
          {/* The cube scrambles and solves itself: message solved. */}
          <TwistyCube className="my-6" />
          <h2 className="text-3xl font-bold">Message sent!</h2>
          <p className="max-w-sm text-muted">Thanks for reaching out. I&apos;ll get back to you soon.</p>
          <button type="button" onClick={() => setIsSubmitted(false)} className="btn border-base-300 bg-base-100 hover:border-primary">
            Send another message
          </button>
        </output>
      ) : (
        <form action={clientAction} className="space-y-5 p-6 sm:p-8">
          {/* Toggle buttons rather than radios, so a picked topic can be unpicked. */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">What&apos;s it about? <span className="font-normal text-muted">(optional)</span></legend>
            <input type="hidden" name="topic" value={topic ?? ""} />
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_TOPICS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={topic === option}
                  onClick={() => setTopic(topic === option ? null : option)}
                  className={`rounded-field border border-base-300 bg-base-100 px-3 py-2.5 text-center text-sm font-medium transition-colors hover:border-muted ${TOPIC_CLASS[option]}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium">Name</label>
              <input id="name" name="name" type="text" autoComplete="name" required className={`input ${fieldClass}`} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className={`input ${fieldClass}`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="message" className="block text-sm font-medium">Message</label>
            <textarea id="message" name="message" rows={6} required className={`textarea ${fieldClass}`} />
          </div>
          {/* Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          {error && <div role="alert" className="alert alert-error">{error}</div>}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
            {isSubmitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </div>
  )
}
