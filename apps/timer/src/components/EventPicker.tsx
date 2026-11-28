"use client";

import { TIMER_EVENTS } from "@bengottschalk/timer-core/events";
import { eventIconClass } from "@bengottschalk/wca/events";
import { withShortcut } from "@/lib/shortcuts";

export default function EventPicker({ eventId, onChange }: { eventId: string; onChange: (eventId: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className={`${eventIconClass(eventId)} text-xl`} aria-hidden />
      <span className="sr-only">Event</span>
      {/* data-event-picker: the E shortcut finds the menu by it. */}
      <select className="select select-sm w-auto" data-event-picker title={withShortcut("Event", "event")} value={eventId} onChange={(e) => {
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
