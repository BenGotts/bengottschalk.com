// The scramble on screen, plus the next one made ahead of time and kept in
// memory only. Some events take cubing.js a moment (big cubes a good while),
// so the next scramble is made while the current one is being solved, and
// finishing a solve can show it straight away. It's plain code with no React
// in it, so the timing can be tested with a stand-in generator.

export interface ScrambleState {
  eventId: string;
  scramble: string | null;
  /** Earlier scrambles for this event, newest last. */
  history: string[];
  error: string | null;
  /** Whether the current scramble was typed in rather than made here. */
  custom: boolean;
}

export const emptyScrambleState = (eventId: string): ScrambleState => ({ eventId, scramble: null, history: [], error: null, custom: false });

/** One scramble being made, and how it turned out once it has. */
interface Slot {
  result: { ok: true; scramble: string } | { ok: false; error: unknown } | null;
}

export class ScrambleQueue {
  private state: ScrambleState;
  private readonly listeners = new Set<() => void>();
  private running = false;
  /** The scramble the screen is waiting on (it shows "Making a scramble…" meanwhile). */
  private waiting: Slot | null = null;
  /** The one made ahead of time for after the current scramble. */
  private queued: Slot | null = null;

  constructor(private readonly generate: (eventId: string) => Promise<string>, eventId: string) {
    this.state = emptyScrambleState(eventId);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  /**
   * Starts on an event with a fresh scramble. Anything still being made for
   * the last event is dropped: cubing.js can't stop a search part way, but
   * its result is ignored when it lands, so it can't show up on the new event.
   */
  show = (eventId: string) => {
    if (this.running && this.state.eventId === eventId) return;
    this.running = true;
    this.queued = null;
    this.waiting = this.start(eventId);
    this.set(emptyScrambleState(eventId));
  };

  /** Drops everything in flight (when the page using it goes away). */
  stop = () => {
    this.running = false;
    this.waiting = null;
    this.queued = null;
  };

  /**
   * Moves on to the scramble made ahead of time: straight away if it's ready,
   * otherwise as soon as it is. Used both when a solve is finished and when
   * a scramble is skipped by hand.
   */
  next = () => {
    // Already waiting for one: pressing again shouldn't start another, which would only slow the first down.
    if (!this.running || this.waiting) return;
    const { scramble, history } = this.state;
    let slot = this.queued;
    this.queued = null;
    // One that failed ahead of time gets another go now, rather than showing its error.
    if (!slot || slot.result?.ok === false) slot = this.start(this.state.eventId);
    this.waiting = slot;
    this.set({ ...this.state, scramble: null, error: null, custom: false, history: scramble ? [...history, scramble] : history });
    if (slot.result) this.display(slot);
  };

  /** Goes back to the last scramble (if a solve was deleted and redone, say). */
  previous = () => {
    if (!this.running || this.state.history.length === 0) return;
    this.park();
    const { history } = this.state;
    this.set({ ...this.state, scramble: history.at(-1)!, history: history.slice(0, -1), error: null, custom: false });
    this.fill();
  };

  /** Uses a scramble typed in (already checked); the one it replaces is kept for Previous. */
  applyCustom = (scramble: string) => {
    if (!this.running) return;
    this.park();
    const { scramble: replaced, history } = this.state;
    this.set({ ...this.state, scramble, error: null, custom: true, history: replaced ? [...history, replaced] : history });
    this.fill();
  };

  private start(eventId: string): Slot {
    const slot: Slot = { result: null };
    void (async () => {
      try {
        slot.result = { ok: true, scramble: await this.generate(eventId) };
      } catch (error) {
        slot.result = { ok: false, error };
      }
      // Only the one the screen is waiting on shows; a queued one waits for Next, and one for an old event is dropped.
      if (slot === this.waiting) this.display(slot);
    })();
    return slot;
  }

  /** Shows the scramble the screen was waiting on, then starts making the one after it. */
  private display(slot: Slot) {
    this.waiting = null;
    if (slot.result?.ok) {
      this.set({ ...this.state, scramble: slot.result.scramble, error: null, custom: false });
      this.fill();
    } else {
      console.error("Scramble failed", slot.result?.error);
      // No new one is started here, so a generator that keeps failing doesn't spin; Next tries again.
      this.set({ ...this.state, error: "Couldn't make a scramble. Try again." });
    }
  }

  /**
   * A scramble set by hand while one was still being made: the one being made
   * isn't thrown away but kept for next time, so it isn't made twice.
   */
  private park() {
    if (!this.waiting) return;
    this.queued = this.waiting;
    this.waiting = null;
  }

  /** Makes the next scramble ahead of time, unless one is already on the way. */
  private fill() {
    if (!this.queued && !this.waiting) this.queued = this.start(this.state.eventId);
  }

  private set(state: ScrambleState) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}
