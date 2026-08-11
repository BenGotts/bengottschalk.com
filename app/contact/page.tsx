"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type TopicType = "cubing" | "tech" | "music" | "content" | "general";

const TOPICS: TopicType[] = ["cubing", "tech", "music", "content", "general"];

function isTopicType(value: string | null): value is TopicType {
  return TOPICS.includes(value as TopicType);
}

function ContactPageContent() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState<TopicType>("cubing");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const param = searchParams.get("topic");
    if (isTopicType(param)) {
      setTopic(param);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Contact</h1>
        <p className="text-sm text-slate-400">
          Pick a topic below to ensure your message goes to the right place.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setTopic("cubing")}
          className={`py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg transition-colors ${
            topic === "cubing" ? "bg-emerald-500 text-slate-950" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Cubing / WCA
        </button>
        <button
          type="button"
          onClick={() => setTopic("tech")}
          className={`py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg transition-colors ${
            topic === "tech" ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Software
        </button>
        <button
          type="button"
          onClick={() => setTopic("music")}
          className={`py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg transition-colors ${
            topic === "music" ? "bg-blue-500 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Music
        </button>
        <button
          type="button"
          onClick={() => setTopic("content")}
          className={`py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg transition-colors ${
            topic === "content" ? "bg-cyan-400 text-slate-950" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Daily Solves
        </button>
        <button
          type="button"
          onClick={() => setTopic("general")}
          className={`py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg transition-colors col-span-2 sm:col-span-1 ${
            topic === "general" ? "bg-slate-700 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
          }`}
        >
          General
        </button>
      </div>

      <div className="bg-slate-900 border-2 border-slate-800 p-4 sm:p-6 lg:p-8 rounded-2xl">
        {submitted ? (
          <div className="bg-slate-950 border border-emerald-500 p-6 rounded-xl text-center space-y-2">
            <p className="text-emerald-400 font-bold text-lg">Message Sent!</p>
            <p className="text-slate-300 text-sm">
              Thanks for reaching out regarding{" "}
              <span className="font-bold uppercase text-white">{topic}</span>. I will reply soon.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-white">
                {topic === "cubing" && "WCA Competition & Regional Delegating"}
                {topic === "tech" && "Software Development & Engineering Project"}
                {topic === "music" && "Trumpet & Ensembles Booking"}
                {topic === "content" && "Solve of the Day / Social Media"}
                {topic === "general" && "General Inquiry"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            {topic === "cubing" && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  WCA ID or Competition Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024GOTT01 or Oregon Championship 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Message</label>
              <textarea
                required
                rows={5}
                placeholder="Your message..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none resize-y min-h-[120px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-70 text-slate-950 font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading contact form…</div>}>
      <ContactPageContent />
    </Suspense>
  );
}