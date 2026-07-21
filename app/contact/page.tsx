// app/contact/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type TopicType = "cubing" | "tech" | "music" | "content" | "general";

export default function ContactPage() {
  const [topic, setTopic] = useState<TopicType>("cubing");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* NAVIGATION */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-sky-400 tracking-tight">
            bengottschalk<span className="text-emerald-400">.com</span>
          </Link>
          <nav className="hidden md:flex gap-8 font-semibold text-sm">
            <Link href="/" className="hover:text-sky-400 transition-colors">HOME</Link>
            <Link href="/cubing" className="hover:text-emerald-400 transition-colors">CUBING</Link>
            <Link href="/tech" className="hover:text-emerald-400 transition-colors">TECH</Link>
            <Link href="/music" className="hover:text-emerald-400 transition-colors">MUSIC</Link>
            <Link href="/content" className="hover:text-emerald-400 transition-colors">CONTENT</Link>
            <Link href="/contact" className="text-sky-400 border-b-2 border-sky-400 pb-1">CONTACT</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        
        {/* PAGE HEADER */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-white">Contact</h1>
          <p className="text-sm text-slate-400">
            Pick a topic below to ensure your message goes to the right place.
          </p>
        </div>

        {/* TOPIC SELECTOR (Solid Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <button
            onClick={() => setTopic("cubing")}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
              topic === "cubing" ? "bg-emerald-500 text-slate-950" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            🧊 Cubing / WCA
          </button>
          <button
            onClick={() => setTopic("tech")}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
              topic === "tech" ? "bg-sky-500 text-slate-950" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            💻 Software Tech
          </button>
          <button
            onClick={() => setTopic("music")}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
              topic === "music" ? "bg-blue-500 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            🎺 Music / Brass
          </button>
          <button
            onClick={() => setTopic("content")}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
              topic === "content" ? "bg-cyan-400 text-slate-950" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            📹 Daily Solves
          </button>
          <button
            onClick={() => setTopic("general")}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors col-span-2 sm:col-span-1 ${
              topic === "general" ? "bg-slate-700 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
            }`}
          >
            💬 General
          </button>
        </div>

        {/* SOLID FORM CONTAINER */}
        <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-2xl">
          {submitted ? (
            <div className="bg-slate-950 border border-emerald-500 p-6 rounded-xl text-center space-y-2">
              <p className="text-emerald-400 font-bold text-lg">Message Sent!</p>
              <p className="text-slate-300 text-sm">
                Thanks for reaching out regarding <span className="font-bold uppercase text-white">{topic}</span>. I will reply soon.
              </p>
              <button 
                onClick={() => setSubmitted(false)} 
                className="btn btn-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none mt-2"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">
                  {topic === "cubing" && "WCA Competition & Regional Delegating"}
                  {topic === "tech" && "Software Development & Engineering Project"}
                  {topic === "music" && "Trumpet & Ensembles Booking"}
                  {topic === "content" && "Solve of the Day / Social Media"}
                  {topic === "general" && "General Inquiry"}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-bold text-slate-300 mb-1">WCA ID or Competition Name (Optional)</label>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

            </form>
          )}
        </div>

      </main>
    </div>
  );
}