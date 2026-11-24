"use client";

import { TIMER_EVENTS } from "@bengottschalk/timer-core/events";
import { eventIconClass } from "@bengottschalk/wca/events";

export default function EventPicker({ eventId, onChange }: { eventId: string; onChange: (eventId: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className={`${eventIconClass(eventId)} text-xl`} aria-hidden />
      <span className="sr-only">Event</span>
      <select className="select select-sm w-auto" value={eventId} onChange={(e) => {
        onChange(e.target.value);
        // Hand the space bar back to the timer (a focused menu would open on Space).
        e.target.blur();
      }}>
        {TIMER_EVENTS.map((event) => (
          <option key={event.id} value={event.id}>{event.name}</option>
        ))}
      </select>
    </label>
  );
}
